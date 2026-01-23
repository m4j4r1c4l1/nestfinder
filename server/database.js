import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const DB_PATH = join(__dirname, 'db', 'nestfinder.db');

let db = null;

// Initialize database
export const initDatabase = async () => {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  // Load existing database or create new one
  if (existsSync(DB_PATH)) {
    try {
      const fileBuffer = readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      // Verify integrity immediately - this will throw if malformed
      db.run("PRAGMA integrity_check");
    } catch (err) {
      console.error('CRITICAL: Database file is malformed or corrupted.', err);
      const dbDir = dirname(DB_PATH);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = join(dbDir, `nestfinder.db.corrupt.${timestamp}.db`);
      console.log(`Renaming corrupted database to: ${backupPath} and starting fresh.`);
      try {
        renameSync(DB_PATH, backupPath);
      } catch (renameErr) {
        console.error('Failed to rename corrupted DB:', renameErr);
      }
      db = new SQL.Database();
      db._recovered = true; // Signal that we are in recovery mode
    }
  } else {
    db = new SQL.Database();
  }

  // ==========================================
  // SCHEMA DEFINITIONS (Complete Tables)
  // ==========================================

  // Users table (anonymous users with optional nicknames)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT,
      device_id TEXT UNIQUE NOT NULL,
      trust_score INTEGER DEFAULT 0,
      recovery_key TEXT,
      blocked BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

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

  // Points table (locations submitted by users)
  db.run(`
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

  // Confirmations table (user votes on points)
  db.run(`
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

  // Logs table (all user actions for audit)
  db.run(`
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

  // Settings table (admin-configurable settings)
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Admins table
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Push subscriptions for Web Push notifications
  db.run(`
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

  // Broadcasts table (admin announcements)
  db.run(`
    CREATE TABLE IF NOT EXISTS broadcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      message TEXT NOT NULL,
      image_url TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      max_views INTEGER DEFAULT NULL,
      priority INTEGER DEFAULT 0,
      lane INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add lane column to existing broadcasts tables
  try {
    db.run(`ALTER TABLE broadcasts ADD COLUMN lane INTEGER DEFAULT NULL`);
  } catch (e) {
    // Column already exists - ignore
  }

  // User Feedback table
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      type TEXT DEFAULT 'general',
      message TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      rating INTEGER,
      deleted_by_sender BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Migration: Add deleted_by_sender to feedback
  try {
    db.run(`ALTER TABLE feedback ADD COLUMN deleted_by_sender BOOLEAN DEFAULT 0`);
  } catch (e) {
    // Column likely exists
  }

  // Migration: Add sender_name for system messages (e.g., "🛡️ System")
  try {
    db.run(`ALTER TABLE feedback ADD COLUMN sender_name TEXT`);
  } catch (e) {
    // Column likely exists
  }

  // Migration: Add icon for visual indicator (e.g., "💣", "💥")
  try {
    db.run(`ALTER TABLE feedback ADD COLUMN icon TEXT`);
  } catch (e) {
    // Column likely exists
  }

  // In-App Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      type TEXT DEFAULT 'info',
      image_url TEXT,
      batch_id TEXT,
      read BOOLEAN DEFAULT 0,
      delivered BOOLEAN DEFAULT 0,
      delivered_at DATETIME,
      read_at DATETIME,
      dismissed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

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

  // ==========================================
  // INDEXES
  // ==========================================

  db.run(`CREATE INDEX IF NOT EXISTS idx_points_status ON points(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_points_user ON points(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_confirmations_point ON confirmations(point_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_batch ON notifications(batch_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_broadcast_views_broadcast ON broadcast_views(broadcast_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_broadcast_views_user ON broadcast_views(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_broadcast_views_status ON broadcast_views(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_daily_ratings_date ON daily_ratings(date);`);

  // ==========================================
  // MIGRATIONS (For existing databases only)
  // These add columns that may be missing from older schemas
  // ==========================================

  // Users table migrations
  try { db.run("ALTER TABLE users ADD COLUMN trust_score INTEGER DEFAULT 0"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE users ADD COLUMN recovery_key TEXT"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE users ADD COLUMN blocked BOOLEAN DEFAULT 0"); } catch (e) { /* Exists */ }

  // Notifications table migrations
  try { db.run("ALTER TABLE notifications ADD COLUMN image_url TEXT"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE notifications ADD COLUMN batch_id TEXT"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE notifications ADD COLUMN delivered BOOLEAN DEFAULT 0"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE notifications ADD COLUMN delivered_at DATETIME"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE notifications ADD COLUMN read_at DATETIME"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE notifications ADD COLUMN dismissed BOOLEAN DEFAULT 0"); } catch (e) { /* Exists */ }

  // Broadcasts table migrations
  try { db.run("ALTER TABLE broadcasts ADD COLUMN title TEXT"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE broadcasts ADD COLUMN image_url TEXT"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE broadcasts ADD COLUMN max_views INTEGER DEFAULT NULL"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE broadcasts ADD COLUMN priority INTEGER DEFAULT 0"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE broadcasts ADD COLUMN start_time DATETIME"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE broadcasts ADD COLUMN end_time DATETIME"); } catch (e) { /* Exists */ }

  // Feedback table migrations
  try { db.run("ALTER TABLE feedback ADD COLUMN rating INTEGER"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE feedback ADD COLUMN status TEXT DEFAULT 'sent'"); } catch (e) { /* Exists */ }

  // Debug feature migrations
  try { db.run("ALTER TABLE users ADD COLUMN debug_enabled INTEGER DEFAULT 0"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE users ADD COLUMN debug_last_seen DATETIME"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE users ADD COLUMN debug_level TEXT DEFAULT 'default'"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE users ADD COLUMN debug_session_start DATETIME"); } catch (e) { /* Exists */ }
  try { db.run("ALTER TABLE users ADD COLUMN debug_session_end DATETIME"); } catch (e) { /* Exists */ }

  // Client logs table (per-user debug logs)
  db.run(`
    CREATE TABLE IF NOT EXISTS client_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      logs TEXT NOT NULL,
      platform TEXT,
      user_agent TEXT,
      ip_address TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_client_logs_user_id ON client_logs(user_id);`);

  // Migration: Add ip_address to client_logs
  try { db.run("ALTER TABLE client_logs ADD COLUMN ip_address TEXT"); } catch (e) { /* Exists */ }




  // ==========================================
  // DEFAULT DATA
  // ==========================================

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
    { key: 'rate_limit_vote', value: '30' },
    { key: 'rate_limit_admin_login', value: '5' },
    { key: 'debug_mode_enabled', value: 'false' },
    { key: 'debug_retention_days', value: '7' },
    { key: 'backup_retention_days', value: '30' },
    { key: 'corrupt_retention_days', value: '30' },
    { key: 'upload_retention_days', value: '30' }
  ];

  defaultSettings.forEach(s => {
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, [s.key, s.value]);
  });

  // Create default admin (password: admin123 - should be changed!)
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`, ['admin', adminPassword]);

  // Emergency password reset via environment variable
  // Set NEST_BREAKGLASS=yourNewPassword in Render, restart, login, then remove the env var
  if (process.env.NEST_BREAKGLASS) {
    const newHash = bcrypt.hashSync(process.env.NEST_BREAKGLASS, 10);
    db.run(`UPDATE admins SET password_hash = ? WHERE username = ?`, [newHash, 'admin']);
    console.log('⚠️ ADMIN PASSWORD RESET via environment variable. Remove NEST_BREAKGLASS after login!');
  }

  // Create system user for internal logging
  db.run(`INSERT OR IGNORE INTO users (id, nickname, device_id) VALUES (?, ?, ?)`, ['system', 'System 🛡️', 'system_internal']);

  // Save to file
  saveDatabase();

  console.log('Database initialized successfully');
  return db;
};

// Save database to file
export const saveDatabase = () => {
  if (db) {
    // Ensure directory exists
    const dbDir = dirname(DB_PATH);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
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

// Helper: run query WITHOUT immediate save (for batch operations)
export const runWithoutSave = (sql, params = []) => {
  db.run(sql, params);
};

export default { initDatabase, getDb, run, runWithoutSave, get, all, log, getSetting, getSettings, saveDatabase, resetDatabase };
