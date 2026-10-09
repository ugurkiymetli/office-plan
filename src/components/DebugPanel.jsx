'use client';

import {
  Building2,
  Clock,
  House,
  Moon,
  Palmtree,
  RotateCcw,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { addDays, formatDate, getDayStatus, isoWeekday, todayKey } from '../lib/schedule';
import { useI18n } from '../lib/i18n';
import { Button } from '@/components/arc/button/button';
import { Input } from '@/components/arc/input/input';

export function isDebugEnabled() {
  const flag = process.env.NEXT_PUBLIC_SHOW_DEBUG;
  if (flag !== undefined && flag !== '') {
    return flag === 'true';
  }
  return process.env.NODE_ENV !== 'production';
}

export function DebugToggleButton({ isDebugActive, isOpen, onToggle }) {
  const { t } = useI18n();

  return (
    <Button
      type="button"
      variant={isDebugActive ? 'primary' : 'secondary'}
      size="sm"
      onClick={onToggle}
      className="shrink-0"
    >
      <Wrench className="w-4 h-4" />
      <span>{t('debug.title')}</span>
      {isDebugActive && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
    </Button>
  );
}

export default function DebugPanel({
  plan,
  teamId,
  today,
  isAfter18,
  debugDate,
  debugAfter18,
  onSetDebugDate,
  onSetDebugAfter18,
  onResetDebug,
}) {
  const { t } = useI18n();
  const realToday = todayKey();
  const isDebugActive = Boolean(debugDate || debugAfter18 !== null);

  const jumpToPreset = (targetStatus) => {
    const base = realToday;
    for (let i = 0; i <= 365; i++) {
      const k = addDays(base, i);
      const st = getDayStatus(plan, k, teamId).status;
      if (targetStatus === 'weekend') {
        if (isoWeekday(k) >= 6) {
          onSetDebugDate(k);
          return;
        }
      } else if (targetStatus === 'holiday') {
        if (st === 'holiday' || st === 'off') {
          onSetDebugDate(k);
          return;
        }
      } else if (st === targetStatus) {
        onSetDebugDate(k);
        return;
      }
    }
  };

  return (
    <div className="p-4 rounded-2xl border bg-amber-500/10 border-amber-500/20 text-neutral-900 dark:text-neutral-100 space-y-3.5 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-outfit font-bold text-sm text-amber-700 dark:text-amber-300">
          <Sparkles className="w-4 h-4" />
          <span>{t('debug.title')}</span>
          {isDebugActive && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold uppercase">
              {formatDate(today)}
            </span>
          )}
        </div>
        {isDebugActive && (
          <Button type="button" variant="secondary" size="sm" onClick={onResetDebug}>
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('debug.reset')}</span>
          </Button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {/* Date Preset Buttons */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Preset Status
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="secondary" size="sm" onClick={() => jumpToPreset('office')}>
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('debug.presetOffice')}</span>
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => jumpToPreset('home')}>
              <House className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{t('debug.presetHome')}</span>
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => jumpToPreset('holiday')}>
              <Palmtree className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t('debug.presetHoliday')}</span>
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => jumpToPreset('weekend')}>
              <Moon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{t('debug.presetWeekend')}</span>
            </Button>
          </div>
        </div>

        {/* Time Cutoff & Manual Date Input */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Time & Date Override
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={isAfter18 ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => onSetDebugAfter18(false)}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('debug.timeBefore18')}</span>
            </Button>
            <Button
              type="button"
              variant={isAfter18 ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onSetDebugAfter18(true)}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('debug.timeAfter18')}</span>
            </Button>
            <div className="w-36 shrink-0">
              <Input
                type="date"
                value={today}
                onChange={(e) => onSetDebugDate(e.target.value || null)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
