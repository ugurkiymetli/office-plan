'use client';

import { useState } from 'react';
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import {
  STATUS,
  addDays,
  formatDate,
  formatRange,
  getDayStatus,
  isoWeekday,
  mondayOf,
  parseKey,
  todayKey,
} from '../lib/schedule';
import { Card, STATUS_ICONS, Segmented, StatusBadge, TeamDot } from './ui';
import { Button } from '@/components/arc/button/button';
import MonthCalendar from './MonthCalendar';
import DayDetailSheet from './DayDetailSheet';
import { useI18n } from '../lib/i18n';
import { PREF_COOKIES, setPrefCookie } from '../lib/prefs';

const HERO_STYLE = {
  office: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  home: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
  holiday: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
  off: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
  weekend: 'bg-neutral-100 border-neutral-200 text-neutral-700 dark:bg-neutral-800/60 dark:border-neutral-800 dark:text-neutral-300',
  none: 'bg-neutral-100 border-neutral-200 text-neutral-700 dark:bg-neutral-800/60 dark:border-neutral-800 dark:text-neutral-300',
};

export function TeamPicker({ plan, teamId, onChange }) {
  const { teamName } = useI18n();
  return (
    <Segmented
      options={plan.teams.map((t) => ({ value: t.id, label: teamName(t), icon: <TeamDot team={t} /> }))}
      value={teamId}
      onChange={onChange}
    />
  );
}

function nextWorkday(key) {
  let k = key;
  while (isoWeekday(k) >= 6) k = addDays(k, 1);
  return k;
}

export default function ScheduleView({ plan, initialTeamId }) {
  const { t, teamName } = useI18n();
  const today = todayKey();
  const [teamId, setTeamId] = useState(initialTeamId);
  const [month, setMonth] = useState(() => {
    const d = parseKey(today);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const onTeamChange = (id) => {
    setTeamId(id);
    setPrefCookie(PREF_COOKIES.team, id);
  };

  if (!teamId || !plan.teams.some((t) => t.id === teamId)) {
    return (
      <Card icon={Users} title={t('schedule.selectTeam')}>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('schedule.selectTeamText')}</p>
        <TeamPicker plan={plan} teamId={null} onChange={onTeamChange} />
      </Card>
    );
  }

  const other = plan.teams.find((t) => t.id !== teamId);
  const todayStatus = getDayStatus(plan, today, teamId);
  const otherStatus = getDayStatus(plan, today, other.id);
  const HeroIcon = STATUS_ICONS[todayStatus.status];

  const weekStart = addDays(mondayOf(nextWorkday(today)), weekOffset * 7);
  const weekDays = [0, 1, 2, 3, 4].map((i) => addDays(weekStart, i));
  const weekDiff = Math.round((parseKey(weekStart) - parseKey(mondayOf(today))) / (7 * 86400000));
  const weekRange = formatRange(weekDays[0], weekDays[4]);
  const weekLabel = { [-1]: t('schedule.lastWeek'), 0: t('schedule.thisWeek'), 1: t('schedule.nextWeek') }[weekDiff];
  const nextOffice = (() => {
    for (let i = 1; i <= 120; i++) {
      const k = addDays(today, i);
      if (getDayStatus(plan, k, teamId).status === 'office') return k;
    }
    return null;
  })();

  const monthPrefix = `${month.year}-${String(month.month + 1).padStart(2, '0')}`;
  const monthCounts = { office: 0, home: 0, holiday: 0 };
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const s = getDayStatus(plan, `${monthPrefix}-${String(d).padStart(2, '0')}`, teamId).status;
    if (s === 'off') monthCounts.holiday++;
    else if (s in monthCounts) monthCounts[s]++;
  }

  return (
    <div className="space-y-6">
      <TeamPicker plan={plan} teamId={teamId} onChange={onTeamChange} />

      <section className={`p-5 sm:p-6 rounded-2xl border shadow-lg dark:shadow-2xl animate-fade-in ${HERO_STYLE[todayStatus.status]}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          {t('schedule.today')} · {formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/70 dark:bg-neutral-950/40 flex items-center justify-center">
            <HeroIcon className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="font-outfit font-extrabold text-2xl sm:text-3xl leading-tight">{t(`hero.${todayStatus.status}`)}</h2>
            {todayStatus.holiday && <p className="text-sm font-semibold">{todayStatus.holiday.name}</p>}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-current/10 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <TeamDot team={other} /> {teamName(other)}: {t(`status.${otherStatus.status}`)}
          </span>
          {nextOffice && todayStatus.status !== 'office' && (
            <span>{t('schedule.nextOffice', { date: formatDate(nextOffice) })}</span>
          )}
        </div>
      </section>

      <Card icon={CalendarRange} title={t('schedule.week')}>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w - 1)} aria-label={t('week.prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            title={t('week.current')}
            className="min-w-0 text-center disabled:cursor-default"
          >
            <span className="block font-outfit font-bold text-base text-neutral-900 dark:text-neutral-100">{weekLabel ?? weekRange}</span>
            {weekLabel && <span className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">{weekRange}</span>}
          </button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w + 1)} aria-label={t('week.next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <ul className="grid gap-2 sm:grid-cols-5">
          {weekDays.map((k) => {
            const s = getDayStatus(plan, k, teamId);
            const o = getDayStatus(plan, k, other.id);
            const overlap = s.status === 'office' && o.status === 'office';
            return (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => setSelected(k)}
                  className={`w-full h-full flex sm:flex-col items-center sm:items-start justify-between gap-3 sm:gap-2 px-3.5 py-3 rounded-xl border text-left transition-all bg-neutral-100/80 text-neutral-800 border-neutral-200 dark:bg-neutral-800/60 dark:text-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 ${
                    k === today ? 'ring-2 ring-neutral-900 dark:ring-neutral-100' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-outfit font-bold text-sm">{formatDate(k, { weekday: 'long' })}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate sm:whitespace-normal">
                      {formatDate(k, { day: 'numeric', month: 'short' })}
                      {s.holiday ? ` · ${s.holiday.name}` : ''}
                      {overlap ? ` · ${t('schedule.bothInOffice')}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={s.status} className="shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card icon={CalendarDays} title={t('schedule.month')}>
        <div className="grid grid-cols-3 gap-2">
          {['office', 'home', 'holiday'].map((k) => (
            <div key={k} className={`p-3 rounded-xl border text-center ${HERO_STYLE[k]}`}>
              <p className="font-outfit font-extrabold text-2xl leading-none">{monthCounts[k]}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-1">{t(`status.${k}`)}</p>
            </div>
          ))}
        </div>

        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          selectedKey={selected}
          onSelect={setSelected}
          getCellClass={(k) => STATUS[getDayStatus(plan, k, teamId).status].cell}
          renderExtra={(k) =>
            getDayStatus(plan, k, other.id).status === 'office' ? (
              <TeamDot team={other} className="w-1.5 h-1.5" />
            ) : (
              <span className="w-1.5 h-1.5" />
            )
          }
        />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {['office', 'home', 'holiday', 'none'].map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            <TeamDot team={other} className="w-1.5 h-1.5" /> {t('schedule.inOffice', { team: teamName(other) })}
          </span>
        </div>
      </Card>

      <DayDetailSheet plan={plan} dateKey={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
