'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { formatDate, getDayStatus } from '../lib/schedule';
import { InfoTip, Segmented, StatusBadge, TeamBadge } from './ui';
import { useI18n } from '../lib/i18n';

const OVERRIDE_VALUES = ['auto', 'office', 'home', 'off'];

export default function DayDetailSheet({ plan, dateKey, onClose, editable = false, onSetOverride }) {
  const { t } = useI18n();
  const overrideOptions = OVERRIDE_VALUES.map((value) => ({ value, label: t(`override.${value}`) }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!dateKey) return null;
  const firstStatus = getDayStatus(plan, dateKey, plan.teams[0].id);
  const holiday = firstStatus.holiday;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label={t('common.close')} onClick={onClose} className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm" />
      <div className="relative glass-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 pb-8 sm:pb-5 shadow-2xl animate-fade-in space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{t('day.details')}</p>
            <h3 className="font-outfit font-bold text-xl text-neutral-900 dark:text-neutral-100">
              {formatDate(dateKey, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            {holiday && (
              <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">{holiday.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul className="space-y-2">
          {plan.teams.map((team) => {
            const s = getDayStatus(plan, dateKey, team.id);
            return (
              <li
                key={team.id}
                className="p-3 rounded-xl border bg-neutral-100/80 text-neutral-800 border-neutral-200 dark:bg-neutral-800/60 dark:text-neutral-200 dark:border-neutral-800 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1">
                    <TeamBadge team={team} />
                    {editable && (
                      <InfoTip text={t('day.overrideTip')} />
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {s.source === 'override' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{t('day.manual')}</span>
                    )}
                    <StatusBadge status={s.status} />
                  </div>
                </div>
                {editable && (
                  <Segmented
                    size="sm"
                    options={overrideOptions}
                    value={plan.overrides[dateKey]?.[team.id] || 'auto'}
                    onChange={(v) => onSetOverride(dateKey, team.id, v === 'auto' ? null : v)}
                  />
                )}
              </li>
            );
          })}
        </ul>
        {editable && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('day.editHelp')}</p>
        )}
      </div>
    </div>
  );
}
