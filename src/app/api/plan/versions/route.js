import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { listVersions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  return NextResponse.json(await listVersions());
}
