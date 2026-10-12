import { cookies } from 'next/headers';
import ScheduleView from '@/components/ScheduleView';
import { ClientOnly, PlanFooter } from '@/components/ui';
import { getPlan } from '@/lib/db';
import { PREF_COOKIES } from '@/lib/prefs';

export default async function HomePage() {
  const [plan, store] = await Promise.all([getPlan(), cookies()]);
  return (
    <ClientOnly>
      <div className="mx-auto w-full max-w-screen-2xl space-y-8">
        <ScheduleView plan={plan} initialTeamId={store.get(PREF_COOKIES.team)?.value ?? null} />
        <PlanFooter updatedAt={plan.updatedAt} />
      </div>
    </ClientOnly>
  );
}
