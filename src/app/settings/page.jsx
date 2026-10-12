import { cookies } from 'next/headers';
import SettingsView from '@/components/SettingsView';
import { ClientOnly } from '@/components/ui';
import { getPlan } from '@/lib/db';
import { PREF_COOKIES } from '@/lib/prefs';

export default async function SettingsPage() {
  const [plan, store] = await Promise.all([getPlan(), cookies()]);
  return (
    <ClientOnly>
      <div className="mx-auto w-full max-w-2xl">
        <SettingsView plan={plan} initialTeamId={store.get(PREF_COOKIES.team)?.value ?? null} />
      </div>
    </ClientOnly>
  );
}