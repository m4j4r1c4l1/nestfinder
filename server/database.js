import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'db', 'nestfinder.db');

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );
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

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_points_status ON points(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_points_user ON points(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_confirmations_point ON confirmations(point_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);`);

  // Insert default settings if not exists
  const defaultSettings = [
    { key: 'confirmations_required', value: '1' },
    { key: 'deactivations_required', value: '3' },
    { key: 'deactivation_retention_days', value: '7' },
    { key: 'weekly_reminder_enabled', value: 'true' },
    { key: 'app_name', value: 'NestFinder' }
  ];

  defaultSettings.forEach(s => {
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, [s.key, s.value]);
  });

  // Create default admin (password: admin123 - should be changed!)
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`, ['admin', adminPassword]);

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
