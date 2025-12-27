import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'db', 'nestfinder.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Users table (anonymous users with optional nicknames)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT,
    device_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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

  -- Settings table (admin-configurable settings)
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Admins table
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_points_status ON points(status);
  CREATE INDEX IF NOT EXISTS idx_points_user ON points(user_id);
  CREATE INDEX IF NOT EXISTS idx_confirmations_point ON confirmations(point_id);
  CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
`);

// Insert default settings if not exists
const defaultSettings = [
  { key: 'confirmations_required', value: '1' },
  { key: 'deactivations_required', value: '3' },
  { key: 'weekly_reminder_enabled', value: 'true' },
  { key: 'app_name', value: 'NestFinder' }
];

const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
`);

defaultSettings.forEach(s => insertSetting.run(s.key, s.value));

// Create default admin (password: admin123 - should be changed!)
import bcrypt from 'bcryptjs';
const adminPassword = bcrypt.hashSync('admin123', 10);
db.prepare(`
  INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)
`).run('admin', adminPassword);

export default db;

// Helper functions
export const log = (userId, action, targetId = null, metadata = null) => {
  db.prepare(`
    INSERT INTO logs (user_id, action, target_id, metadata)
    VALUES (?, ?, ?, ?)
  `).run(userId, action, targetId, metadata ? JSON.stringify(metadata) : null);
};

export const getSetting = (key) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
};

export const getSettings = () => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
};
