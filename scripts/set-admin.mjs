// Usage: npm run admin:set -- <username> [--print]
//   --print  only prints the SQL (with the password hash) so you can run it in the Turso shell yourself.
import readline from 'node:readline';
import { hashPassword } from '../src/lib/password.js';

const username = process.argv[2];
const printOnly = process.argv.includes('--print');

if (!username || username.startsWith('--') || !/^[\w.@-]{1,64}$/.test(username)) {
  console.error('Usage: npm run admin:set -- <username> [--print]');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (!rl.muted) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    rl.muted = true;
  });
}

const password = await askHidden(`Password for ${username}: `);
if (password.length < 12) {
  console.error('Password must be at least 12 characters.');
  process.exit(1);
}
if ((await askHidden('Repeat password: ')) !== password) {
  console.error('Passwords do not match.');
  process.exit(1);
}

const hash = await hashPassword(password);
const sql = `INSERT INTO admins (username, password_hash) VALUES (?, ?)
  ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`;

if (printOnly) {
  console.log(sql.replace('?', `'${username}'`).replace('?', `'${hash}'`) + ';');
} else {
  const { connect } = await import('./db.mjs');
  await connect().execute({ sql, args: [username, hash] });
  console.log(`Admin "${username}" saved.`);
}
