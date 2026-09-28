import { createHash, timingSafeEqual } from 'node:crypto';
import { createClient } from '@libsql/client';
import { normalizePlan } from '../src/lib/schedule.js';

const MAX_BYTES = 1024 * 1024;

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let ready = null;
function init() {
  ready ??= db
    .execute(
      `CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    )
    .catch((err) => {
      ready = null;
      throw err;
    });
  return ready;
}

const sha256 = (s) => createHash('sha256').update(String(s)).digest();

function isAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const header = req.headers.authorization || '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  return given.length > 0 && timingSafeEqual(sha256(given), sha256(expected));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    await init();

    if (req.method === 'GET') {
      const { rows } = await db.execute('SELECT data FROM plans WHERE id = 1');
      if (!rows.length) return res.status(404).json({ error: 'No plan published yet.' });
      return res.status(200).json(JSON.parse(rows[0].data));
    }

    if (req.method === 'PUT') {
      if (!isAuthorized(req)) return res.status(401).json({ error: 'Invalid admin password.' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const plan = { ...normalizePlan(body), updatedAt: new Date().toISOString() };
      const data = JSON.stringify(plan);
      if (data.length > MAX_BYTES) return res.status(413).json({ error: 'Plan is too large.' });

      await db.execute({
        sql: `INSERT INTO plans (id, data, updated_at) VALUES (1, ?, ?)
              ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
        args: [data, plan.updatedAt],
      });
      return res.status(200).json(plan);
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    if (err instanceof SyntaxError || /^Plan must|^Team ids/.test(err?.message)) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
}
