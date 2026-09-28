import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getAdmin } from './db';

export const SESSION_COOKIE = 'owp_session';
const MAX_AGE = 7 * 24 * 60 * 60;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: MAX_AGE,
};

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be set (at least 32 characters).');
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

// Changes whenever the admin's password hash changes, which invalidates old sessions.
const passwordVersion = (hash) => createHash('sha256').update(hash).digest('base64url').slice(0, 16);

export function createSessionToken(admin) {
  const payload = Buffer.from(
    JSON.stringify({ u: admin.username, v: passwordVersion(admin.password_hash), exp: Math.floor(Date.now() / 1000) + MAX_AGE })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readToken(token) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() / 1000 ? data : null;
  } catch {
    return null;
  }
}

// Signature check only (no DB call); good enough for showing UI, not for authorizing writes.
export async function hasSessionCookie() {
  try {
    return Boolean(readToken((await cookies()).get(SESSION_COOKIE)?.value));
  } catch {
    return false;
  }
}

export async function getAdminSession() {
  const data = readToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!data) return null;
  const admin = await getAdmin(data.u);
  return admin && passwordVersion(admin.password_hash) === data.v ? { username: admin.username } : null;
}

export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return false;
  }
}

export function clientIp(request) {
  return request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}
