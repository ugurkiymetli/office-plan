import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminSession, isSameOrigin } from '@/lib/auth';
import { MAX_PLAN_BYTES, PLAN_TAG, PlanError, getPublishedPlan, savePlan } from '@/lib/db';

export const dynamic = 'force-dynamic';

const error = (message, status) => NextResponse.json({ error: message }, { status });

export async function GET() {
  const plan = await getPublishedPlan();
  return plan ? NextResponse.json(plan) : error('No plan published yet.', 404);
}

export async function PUT(request) {
  if (!isSameOrigin(request)) return error('Forbidden.', 403);
  const session = await getAdminSession();
  if (!session) return error('Not signed in.', 401);
  if (Number(request.headers.get('content-length')) > MAX_PLAN_BYTES) return error('Plan is too large.', 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON.', 400);
  }

  try {
    const plan = await savePlan(body, session.username);
    revalidateTag(PLAN_TAG);
    return NextResponse.json(plan);
  } catch (err) {
    if (err instanceof PlanError) return error(err.message, err.status);
    throw err;
  }
}
