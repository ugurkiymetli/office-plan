import { connect } from './db.mjs';

const db = connect();

await db.batch(
  [
    `CREATE TABLE IF NOT EXISTS plan_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS admins (
      username TEXT PRIMARY KEY COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS login_attempts (
      ip TEXT PRIMARY KEY,
      failures INTEGER NOT NULL,
      window_start INTEGER NOT NULL
    )`,
  ],
  'write'
);

// Carry over the plan saved by the previous single-row `plans` table, if any.
const legacy = await db.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'plans'");
if (legacy.rows.length) {
  const { rows } = await db.execute('SELECT COUNT(*) AS n FROM plan_versions');
  if (Number(rows[0].n) === 0) {
    await db.execute(
      "INSERT INTO plan_versions (data, created_at, created_by) SELECT data, updated_at, 'legacy' FROM plans WHERE id = 1"
    );
    console.log('Copied plan from legacy `plans` table.');
  }
}

console.log('Database is up to date.');
