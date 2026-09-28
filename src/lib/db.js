import 'server-only';
import { createClient } from '@libsql/client';
import { unstable_cache } from 'next/cache';
import { createDefaultPlan, normalizePlan } from './schedule';

export const PLAN_TAG = 'plan';
export const MAX_PLAN_BYTES = 1024 * 1024;
const KEEP_VERSIONS = 200;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;

export class PlanError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

let client;
function db() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error('TURSO_DATABASE_URL is not set.');
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return client;
}

/* ----------------------------- Plans ----------------------------- */

export const getPublishedPlan = unstable_cache(
  async () => {
    const { rows } = await db().execute('SELECT data FROM plan_versions ORDER BY id DESC LIMIT 1');
    return rows.length ? normalizePlan(JSON.parse(rows[0].data)) : null;
  },
  ['published-plan'],
  { tags: [PLAN_TAG] }
);

export async function getPlan() {
  return (await getPublishedPlan()) ?? createDefaultPlan();
}

export async function savePlan(raw, username) {
  let plan;
  try {
    plan = { ...normalizePlan(raw), updatedAt: new Date().toISOString() };
  } catch (err) {
    throw new PlanError(err.message);
  }
  const data = JSON.stringify(plan);
  if (data.length > MAX_PLAN_BYTES) throw new PlanError('Plan is too large.', 413);

  await db().batch(
    [
      { sql: 'INSERT INTO plan_versions (data, created_at, created_by) VALUES (?, ?, ?)', args: [data, plan.updatedAt, username] },
      {
        sql: 'DELETE FROM plan_versions WHERE id <= (SELECT id FROM plan_versions ORDER BY id DESC LIMIT 1 OFFSET ?)',
        args: [KEEP_VERSIONS],
      },
    ],
    'write'
  );
  return plan;
}

export async function listVersions(limit = 50) {
  const { rows } = await db().execute({
    sql: 'SELECT id, created_at, created_by FROM plan_versions ORDER BY id DESC LIMIT ?',
    args: [limit],
  });
  return rows.map((r) => ({ id: Number(r.id), createdAt: r.created_at, createdBy: r.created_by }));
}

export async function getVersion(id) {
  const { rows } = await db().execute({ sql: 'SELECT data FROM plan_versions WHERE id = ?', args: [id] });
  return rows.length ? normalizePlan(JSON.parse(rows[0].data)) : null;
}

/* ----------------------------- Admins ---------------------------- */

export async function getAdmin(username) {
  const { rows } = await db().execute({
    sql: 'SELECT username, password_hash FROM admins WHERE username = ?',
    args: [String(username).slice(0, 64)],
  });
  return rows[0] ? { username: rows[0].username, password_hash: rows[0].password_hash } : null;
}

export async function isLoginLocked(ip) {
  const { rows } = await db().execute({ sql: 'SELECT failures, window_start FROM login_attempts WHERE ip = ?', args: [ip] });
  const row = rows[0];
  return Boolean(row && Date.now() - Number(row.window_start) < LOGIN_WINDOW_MS && Number(row.failures) >= LOGIN_MAX_FAILURES);
}

export async function recordLoginFailure(ip) {
  await db().execute({
    sql: `INSERT INTO login_attempts (ip, failures, window_start) VALUES (?1, 1, ?2)
          ON CONFLICT(ip) DO UPDATE SET
            failures = CASE WHEN ?2 - window_start >= ?3 THEN 1 ELSE failures + 1 END,
            window_start = CASE WHEN ?2 - window_start >= ?3 THEN ?2 ELSE window_start END`,
    args: [ip, Date.now(), LOGIN_WINDOW_MS],
  });
}

export async function clearLoginFailures(ip) {
  await db().execute({ sql: 'DELETE FROM login_attempts WHERE ip = ?', args: [ip] });
}
