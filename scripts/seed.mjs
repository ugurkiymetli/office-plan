import { readFile } from 'node:fs/promises';
import { connect } from './db.mjs';
import { normalizePlan } from '../src/lib/schedule.js';

const file = process.argv[2] || 'public/plan.json';
const force = process.argv.includes('--force');
const db = connect();

const { rows } = await db.execute('SELECT COUNT(*) AS n FROM plan_versions');
if (Number(rows[0].n) > 0 && !force) {
  console.log('A plan is already published. Re-run with --force to add this file as a new version.');
  process.exit(0);
}

const plan = { ...normalizePlan(JSON.parse(await readFile(file, 'utf8'))), updatedAt: new Date().toISOString() };
await db.execute({
  sql: 'INSERT INTO plan_versions (data, created_at, created_by) VALUES (?, ?, ?)',
  args: [JSON.stringify(plan), plan.updatedAt, 'seed'],
});
console.log(`Published ${file}.`);
