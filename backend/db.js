const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.DB_PATH || path.join(__dirname, 'finio.db');
const dbDir = path.dirname(dbPath);

// Ensure the database directory exists before opening SQLite.
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (error) => {
  if (!error) return;

  if (error.code === 'SQLITE_CANTOPEN') {
    throw new Error(
      `SQLite cannot open DB at ${dbPath}. Set DB_PATH to a writable location. ` +
      `On Render, mount a persistent disk at /var/data and set DB_PATH=/var/data/finio.db.`
    );
  }

  throw error;
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin','bdm','agent','telecaller','legal','accounts')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Safe migration for older databases that were created before created_at existed.
  try {
    await run('ALTER TABLE users ADD COLUMN created_at TEXT');
  } catch (error) {
    // Ignore duplicate-column errors.
  }

  // Backfill timestamp for pre-existing rows in upgraded databases.
  await run("UPDATE users SET created_at = COALESCE(created_at, datetime('now'))");

  await run(`
    CREATE TABLE IF NOT EXISTS societies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      bdm_id INTEGER,
      FOREIGN KEY (bdm_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      society_id INTEGER NOT NULL,
      due_amount REAL NOT NULL DEFAULT 0,
      due_since TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','escalated','legal','recovered')),
      assigned_agent_id INTEGER,
      assigned_telecaller_id INTEGER,
      FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_telecaller_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      telecaller_id INTEGER NOT NULL,
      outcome TEXT NOT NULL CHECK(outcome IN ('paid','callback','promise_to_pay','not_reachable','escalated')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (telecaller_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('D1','D2','D3')),
      generated_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      pdf_url TEXT,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      paid_on TEXT NOT NULL,
      recorded_by INTEGER NOT NULL,
      reconciled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Safe migration for older databases that were created before created_at existed.
  try {
    await run('ALTER TABLE payments ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP');
  } catch (error) {
    // Ignore duplicate-column errors.
  }

  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_table TEXT NOT NULL,
      target_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

async function logAudit(userId, action, targetTable, targetId = null) {
  if (!userId) return;
  await run(
    `INSERT INTO audit_logs (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)`,
    [userId, action, targetTable, targetId]
  );
}

module.exports = {
  db,
  run,
  get,
  all,
  initDb,
  logAudit,
};
