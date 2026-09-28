import { cookies } from 'next/headers';
import ScheduleView from '@/components/ScheduleView';
import { ClientOnly, PlanFooter } from '@/components/ui';
import { getPlan } from '@/lib/db';
import { PREF_COOKIES } from '@/lib/prefs';

export default async function HomePage() {
  const [plan, store] = await Promise.all([getPlan(), cookies()]);
  return (
    <ClientOnly>
      <ScheduleView plan={plan} initialTeamId={store.get(PREF_COOKIES.team)?.value ?? null} />
      <PlanFooter updatedAt={plan.updatedAt} />
    </ClientOnly>
  );
}
