import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getVersion } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const id = Number((await params).id);
  const plan = Number.isInteger(id) && id > 0 ? await getVersion(id) : null;
  return plan ? NextResponse.json(plan) : NextResponse.json({ error: 'Version not found.' }, { status: 404 });
}
