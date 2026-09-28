import nextEnv from '@next/env';
import { createClient } from '@libsql/client';

nextEnv.loadEnvConfig(process.cwd());

export function connect() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    console.error('TURSO_DATABASE_URL is not set (add it to .env).');
    process.exit(1);
  }
  return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
}
