import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const DB_PATH = join(__dirname, 'db', 'nestfinder.db');

let db = null;

// Initialize database
export const initDatabase = async () => {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    -- Users table (anonymous users with optional nicknames)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT,
      device_id TEXT UNIQUE NOT NULL,
      trust_score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add trust_score if missing
  try {
    db.run("ALTER TABLE users ADD COLUMN trust_score INTEGER DEFAULT 0");
  } catch (error) {
    // Column likely already exists
  }

  // Migration: Add recovery_key if missing
  try {
    db.run("ALTER TABLE users ADD COLUMN recovery_key TEXT");
  } catch (error) {
    // Column likely already exists
  }

  // Migration: Add blocked column if missing
  try {
    db.run("ALTER TABLE users ADD COLUMN blocked BOOLEAN DEFAULT 0");
  } catch (error) {
    // Column likely already exists
  }

  // Dev metrics table for GitHub webhook data
  db.run(`
    CREATE TABLE IF NOT EXISTS dev_metrics (
      id INTEGER PRIMARY KEY,
      last_commit_hash TEXT,
      last_commit_message TEXT,
      last_commit_author TEXT,
      last_commit_time TEXT,
      total_commits INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    -- Points table (locations submitted by users)
    CREATE TABLE IF NOT EXISTS points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'deactivated')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_validated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    -- Confirmations table (user votes on points)
    CREATE TABLE IF NOT EXISTS confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      point_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('confirm', 'deactivate')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (point_id) REFERENCES points(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(point_id, user_id, type)
    );
  `);

  db.run(`
    -- Logs table (all user actions for audit)
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      target_id TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    -- Settings table (admin-configurable settings)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    -- Admins table
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    -- Push subscriptions for Web Push notifications
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    -- Broadcasts table (admin announcements)
    CREATE TABLE IF NOT EXISTS broadcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      image_url TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    -- User Feedback table
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      type TEXT DEFAULT 'general',
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    -- In-App Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      type TEXT DEFAULT 'info',
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);`);

  // Migration: Add image_url to notifications if not exists
  try {
    db.run("ALTER TABLE notifications ADD COLUMN image_url TEXT");
  } catch (e) { /* Column exists */ }

  // Migration: Add batch_id to notifications (for grouping broadcasts)
  try {
    db.run("ALTER TABLE notifications ADD COLUMN batch_id TEXT");
    db.run("CREATE INDEX IF NOT EXISTS idx_notifications_batch ON notifications(batch_id)");
  } catch (e) { /* Column exists */ }

  // Migration: Add delivered to notifications (for tracking receipt)
  try {
    db.run("ALTER TABLE notifications ADD COLUMN delivered BOOLEAN DEFAULT 0");
  } catch (e) { /* Column exists */ }

  // Migration: Add timestamps for delivery/read
  try {
    db.run("ALTER TABLE notifications ADD COLUMN delivered_at DATETIME");
  } catch (e) { /* Column exists */ }
  // Backfill existing (safe to run always)
  db.run("UPDATE notifications SET delivered_at = created_at WHERE delivered = 1 AND delivered_at IS NULL");

  try {
    db.run("ALTER TABLE notifications ADD COLUMN read_at DATETIME");
  } catch (e) { /* Column exists */ }
  // Backfill existing (safe to run always)
  db.run("UPDATE notifications SET read_at = created_at WHERE read = 1 AND read_at IS NULL");

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_points_status ON points(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_points_user ON points(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_confirmations_point ON confirmations(point_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);`);

  // Migration: Add image_url to broadcasts
  try {
    db.run("ALTER TABLE broadcasts ADD COLUMN image_url TEXT");
  } catch (e) { /* Column exists */ }

  // Migration: Add max_views to broadcasts (limit how many times a user sees it)
  try {
    db.run("ALTER TABLE broadcasts ADD COLUMN max_views INTEGER DEFAULT NULL");
  } catch (e) { /* Column exists */ }

  // Migration: Add priority to broadcasts (higher shows first)
  try {
    db.run("ALTER TABLE broadcasts ADD COLUMN priority INTEGER DEFAULT 0");
  } catch (e) { /* Column exists */ }

  // Migration: Add title to broadcasts
  try {
    db.run("ALTER TABLE broadcasts ADD COLUMN title TEXT");
  } catch (e) { /* Column exists */ }

  // Broadcast Views table (tracks per-user broadcast delivery status)
  db.run(`
    CREATE TABLE IF NOT EXISTS broadcast_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      broadcast_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
      view_count INTEGER DEFAULT 0,
      first_seen_at DATETIME,
      delivered_at DATETIME,
      read_at DATETIME,
      dismissed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(broadcast_id, user_id)
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_broadcast_views_broadcast ON broadcast_views(broadcast_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_broadcast_views_user ON broadcast_views(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_broadcast_views_status ON broadcast_views(status);`);

  // Daily ratings aggregation table
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      total_ratings INTEGER DEFAULT 0,
      rating_sum INTEGER DEFAULT 0,
      rating_1 INTEGER DEFAULT 0,
      rating_2 INTEGER DEFAULT 0,
      rating_3 INTEGER DEFAULT 0,
      rating_4 INTEGER DEFAULT 0,
      rating_5 INTEGER DEFAULT 0
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_daily_ratings_date ON daily_ratings(date);`);

  // Migration: Add rating column to feedback
  try {
    db.run("ALTER TABLE feedback ADD COLUMN rating INTEGER");
  } catch (e) { /* Column exists */ }

  // Migration: Add status column to feedback (Fixes missing column issue)
  try {
    db.run("ALTER TABLE feedback ADD COLUMN status TEXT DEFAULT 'new'");
  } catch (e) { /* Column exists */ }

  // Migration: Refactor Feedback Statuses (new->sent, reviewed->read)
  try {
    // 1. Convert 'new' to 'sent'
    db.run("UPDATE feedback SET status = 'sent' WHERE status = 'new'");
    // 2. Convert 'reviewed' or 'resolved' to 'read'
    db.run("UPDATE feedback SET status = 'read' WHERE status IN ('reviewed', 'resolved')");
    // Note: 'delivered' stays 'delivered'
  } catch (e) { console.error('Migration failed:', e); }

  // Migration: Extract ratings from existing feedback messages and populate daily_ratings
  // This runs safely multiple times (only processes messages without rating set)
  const feedbackWithRatings = db.exec(`
    SELECT id, message, created_at FROM feedback 
    WHERE rating IS NULL AND message LIKE '%[Rating:%'
  `);

  if (feedbackWithRatings.length > 0 && feedbackWithRatings[0].values) {
    feedbackWithRatings[0].values.forEach(row => {
      const [id, message, createdAt] = row;
      // Extract rating from message like "[Rating: 5/5 ⭐]"
      const match = message.match(/\[Rating:\s*(\d)\/5/);
      if (match) {
        const rating = parseInt(match[1]);
        if (rating >= 1 && rating <= 5) {
          // Update the feedback record
          db.run("UPDATE feedback SET rating = ? WHERE id = ?", [rating, id]);

          // Extract date from created_at (YYYY-MM-DD)
          const dateStr = createdAt.split(' ')[0].split('T')[0];
          const ratingCol = `rating_${rating}`;

          // Upsert into daily_ratings
          db.run(`
            INSERT INTO daily_ratings (date, total_ratings, rating_sum, ${ratingCol})
            VALUES (?, 1, ?, 1)
            ON CONFLICT(date) DO UPDATE SET
              total_ratings = total_ratings + 1,
              rating_sum = rating_sum + ?,
              ${ratingCol} = ${ratingCol} + 1
          `, [dateStr, rating, rating]);
        }
      }
    });
    saveDatabase();
    console.log('Migrated existing ratings from feedback messages');
  }

  // Insert default settings if not exists
  const defaultSettings = [
    { key: 'confirmations_required', value: '1' },
    { key: 'deactivations_required', value: '3' },
    { key: 'deactivation_retention_days', value: '7' },
    { key: 'weekly_reminder_enabled', value: 'true' },
    { key: 'app_name', value: 'NestFinder' },
    { key: 'polling_interval_ms', value: '60000' },
    { key: 'testing_banner_enabled', value: 'true' },
    { key: 'testing_banner_text', value: 'Beta Testing' },
    { key: 'rate_limit_global', value: '60' },
    { key: 'rate_limit_register', value: '10' },
    { key: 'rate_limit_submit', value: '20' },
    { key: 'rate_limit_vote', value: '30' },
    { key: 'rate_limit_admin_login', value: '5' }
  ];

  defaultSettings.forEach(s => {
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, [s.key, s.value]);
  });

  // Create default admin (password: admin123 - should be changed!)
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`, ['admin', adminPassword]);

  // Create system user for internal logging
  db.run(`INSERT OR IGNORE INTO users (id, nickname, device_id) VALUES (?, ?, ?)`, ['system', 'System 🛡️', 'system_internal']);

  // Clean up legacy VAPID keys if they exist (Run on every start to ensure production is cleaned)
  db.run(`DELETE FROM settings WHERE key IN ('vapid_public_key', 'vapid_private_key')`);

  // Save to file
  saveDatabase();

  console.log('Database initialized successfully');
  return db;
};

// Save database to file
export const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
};

// Get database instance
export const getDb = () => db;

// Helper: run query (for INSERT/UPDATE/DELETE)
export const run = (sql, params = []) => {
  db.run(sql, params);
  saveDatabase();
};

// Helper: get single row
export const get = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
};

// Helper: get all rows
export const all = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
};

// Log helper
export const log = (userId, action, targetId = null, metadata = null) => {
  run(
    `INSERT INTO logs (user_id, action, target_id, metadata) VALUES (?, ?, ?, ?)`,
    [userId, action, targetId, metadata ? JSON.stringify(metadata) : null]
  );
};

// Settings helpers
export const getSetting = (key) => {
  const row = get('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
};

export const getSettings = () => {
  const rows = all('SELECT key, value FROM settings');
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
};

// Reset database (clear all data except settings and admins)
export const resetDatabase = (target = 'all') => {
  switch (target) {
    case 'logs':
      db.run('DELETE FROM logs');
      break;
    case 'points':
      db.run('DELETE FROM confirmations');
      db.run('DELETE FROM points');
      db.run("DELETE FROM sqlite_sequence WHERE name IN ('confirmations', 'points')");
      break;
    case 'users':
      db.run('DELETE FROM confirmations');
      db.run('DELETE FROM logs');
      db.run('DELETE FROM points');
      db.run('DELETE FROM users');
      db.run("DELETE FROM sqlite_sequence WHERE name IN ('confirmations', 'logs', 'points')");
      break;
    case 'all':
    default:
      db.run('DELETE FROM confirmations');
      db.run('DELETE FROM logs');
      db.run('DELETE FROM points');
      db.run('DELETE FROM users');
      db.run("DELETE FROM sqlite_sequence WHERE name IN ('confirmations', 'logs', 'points')");
      break;
  }
  saveDatabase();
  console.log(`Database reset completed: ${target}`);
};

export default { initDatabase, getDb, run, get, all, log, getSetting, getSettings, saveDatabase, resetDatabase };
