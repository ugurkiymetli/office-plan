'use client';

import { useState } from 'react';
import { TeamPicker } from './ScheduleView';
import PersonalPlanEditor from './PersonalPlanEditor';
import { Segmented } from './ui';
import { useI18n } from '../lib/i18n';
import { usePersonalPlan } from '../lib/use-personal-plan';
import { PREF_COOKIES, setPrefCookie } from '../lib/prefs';
import { todayKey } from '../lib/schedule';

export default function SettingsView({ plan, initialTeamId }) {
  const { t, lang, setLang } = useI18n();
  const [teamId, setTeamId] = useState(initialTeamId);
  const personal = usePersonalPlan();
  const hasTeam = plan.teams.some((team) => team.id === teamId);
  const onTeamChange = (id) => {
    setTeamId(id);
    setPrefCookie(PREF_COOKIES.team, id);
  };

  return (
    <div className="space-y-6" style={{ color: 'var(--foreground)' }}>
      <h2 className="text-xl font-medium">{t('tab.settings')}</h2>
      <fieldset className="space-y-3 min-w-0">
        <legend className="text-base font-medium">{t('settings.language')}</legend>
        <Segmented
          options={[{ value: 'en', label: 'English' }, { value: 'tr', label: 'Türkçe' }]}
          value={lang}
          onChange={setLang}
        />
      </fieldset>
      {!hasTeam && <p className="text-sm">{t('schedule.selectTeamText')}</p>}
      <TeamPicker plan={plan} teamId={hasTeam ? teamId : null} onChange={onTeamChange} />
      {hasTeam && (
        <PersonalPlanEditor
          key={teamId}
          entry={personal.personalPlan.teams[teamId]}
          today={todayKey()}
          ready={personal.ready}
          message={personal.message}
          onAddOffDays={(start, end) => personal.addOffDays(teamId, start, end)}
          onChange={(kind, key, value) => personal.change(teamId, kind, key, value)}
          onClear={() => personal.clear(teamId)}
        />
      )}
    </div>
  );
}