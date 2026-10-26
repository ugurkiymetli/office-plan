'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { formatDate, getDayStatus } from '../lib/schedule';
import { InfoTip, Segmented, StatusBadge, TeamBadge } from './ui';
import { useI18n } from '../lib/i18n';
import { Drawer, DrawerContent } from '@/components/arc/drawer/drawer';
import { Checkbox } from '@/components/arc/checkbox/checkbox';

const OVERRIDE_VALUES = ['auto', 'office', 'home', 'off'];
const HALF_VALUES = ['half-office', 'half-home'];

export default function DayDetailSheet({ plan, dateKey, onClose, editable = false, onSetOverride, personalStatus, personalValue, personalReady, personalMessage, onSetPersonal }) {
  const { t } = useI18n();
  const [desktop, setDesktop] = useState(false);
  const overrideOptions = OVERRIDE_VALUES.map((value) => ({ value, label: t(`override.${value}`) }));
  const halfOptions = HALF_VALUES.map((value) => ({ value, label: t(`override.${value}`) }));

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  if (!dateKey) return null;
  const firstStatus = getDayStatus(plan, dateKey, plan.teams[0].id);
  const holiday = firstStatus.holiday;

  if (onSetPersonal) {
    return (
      <Drawer open={Boolean(dateKey)} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DrawerContent
          title={formatDate(dateKey, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          description={holiday?.name || t('day.details')}
          side={desktop ? 'right' : 'bottom'}
          style={desktop ? { '--drawer-size': 'min(42rem, calc(100vw - var(--space-6)))' } : undefined}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-medium">{t('personal.title')}</h3>
              <StatusBadge status={personalStatus.status} />
            </div>
            <p className="text-sm">{t(personalStatus.source.startsWith('personal-') ? 'personal.changed' : 'personal.shared')}</p>
            <p role="note" className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Info size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>{t('personal.deviceNote')}</span>
            </p>
            {personalReady && <Segmented options={overrideOptions} value={personalValue} onChange={onSetPersonal} />}
            {personalMessage && <p role={personalMessage.endsWith('Error') ? 'alert' : 'status'} className="text-sm">{t(personalMessage)}</p>}
            <h3 className="text-base font-medium">{t('personal.shared')}</h3>
            <ul className="space-y-3">
              {plan.teams.map((team) => <li key={team.id} className="flex items-center justify-between gap-3"><TeamBadge team={team} /><StatusBadge status={getDayStatus(plan, dateKey, team.id).status} /></li>)}
            </ul>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={Boolean(dateKey)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent
        title={formatDate(dateKey, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        description={holiday?.name || t('day.details')}
        side={desktop ? 'right' : 'bottom'}
        style={desktop ? { '--drawer-size': 'min(42rem, calc(100vw - var(--space-6)))' } : undefined}
      >
        <div className="space-y-4">
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
                {editable && (() => {
                  const current = plan.overrides[dateKey]?.[team.id] || 'auto';
                  const isHalf = HALF_VALUES.includes(current);
                  const set = (v) => onSetOverride(dateKey, team.id, v === 'auto' ? null : v);
                  return (
                    <div className="space-y-2.5">
                      <Segmented size="sm" options={isHalf ? halfOptions : overrideOptions} value={current} onChange={set} />
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={isHalf} onCheckedChange={(checked) => set(checked ? 'half-home' : 'auto')} />
                        {t('day.halfDay')}
                      </label>
                      {isHalf && <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('day.otherHalfHelp')}</p>}
                    </div>
                  );
                })()}
              </li>
            );
          })}
        </ul>
        {editable && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('day.editHelp')}</p>
        )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
