import { NextResponse } from 'next/server';
import { SESSION_COOKIE, clientIp, createSessionToken, isSameOrigin, sessionCookieOptions } from '@/lib/auth';
import { clearLoginFailures, getAdmin, isLoginLocked, recordLoginFailure } from '@/lib/db';
import { verifyPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

// Compared against when the username doesn't exist, so response time doesn't reveal valid usernames.
const DUMMY_HASH = 'scrypt$00000000000000000000000000000000$' + '0'.repeat(128);

const error = (message, status) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  if (!isSameOrigin(request)) return error('Forbidden.', 403);
  const ip = clientIp(request);
  if (await isLoginLocked(ip)) return error('Too many attempts. Try again later.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON.', 400);
  }
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!username || !password || password.length > 256) return error('Invalid username or password.', 401);

  const admin = await getAdmin(username);
  const ok = await verifyPassword(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !ok) {
    await recordLoginFailure(ip);
    return error('Invalid username or password.', 401);
  }

  await clearLoginFailures(ip);
  const res = NextResponse.json({ username: admin.username });
  res.cookies.set(SESSION_COOKIE, createSessionToken(admin), sessionCookieOptions);
  return res;
}

export async function DELETE(request) {
  if (!isSameOrigin(request)) return error('Forbidden.', 403);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
