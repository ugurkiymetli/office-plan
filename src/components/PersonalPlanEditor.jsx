'use client';

import { useState } from 'react';
import { CalendarOff, RotateCcw, Trash2 } from 'lucide-react';
import { Input } from '@/components/arc/input/input';
import { Button } from '@/components/arc/button/button';
import { ConfirmMorph } from '@/components/arc/confirm-morph/confirm-morph';
import { StatusBadge } from './ui';
import { useI18n } from '../lib/i18n';
import { addDays, daysBetween, formatDate, isValidKey, weekdayName } from '../lib/schedule';
import { MAX_PERSONAL_RANGE_DAYS } from '../lib/personal-plan';

export default function PersonalPlanEditor({ entry, today, ready, message, onAddOffDays, onChange, onClear }) {
  const { t } = useI18n();
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState('');
  const [error, setError] = useState(null);
  const dates = Object.entries(entry?.dates || {}).sort(([first], [second]) => first.localeCompare(second));
  const weekdays = Object.entries(entry?.weekdays || {});
  const submit = (event) => {
    event.preventDefault();
    const lastDate = end || start;
    if (!isValidKey(start) || !isValidKey(lastDate) || lastDate < start) {
      setError('personal.invalidDates');
      return;
    }
    if (daysBetween(start, lastDate) + 1 > MAX_PERSONAL_RANGE_DAYS) {
      setError('personal.rangeTooLong');
      return;
    }
    setError(null);
    onAddOffDays(start, lastDate);
  };

  return (
    <section className="space-y-4 border-t border-[var(--border)] pt-5" aria-labelledby="personal-heading" style={{ color: 'var(--foreground)' }}>
      <h2 id="personal-heading" className="text-lg font-medium">{t('personal.offDays')}</h2>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('personal.local')}</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('personal.start')} type="date" required value={start} onChange={(event) => setStart(event.target.value)} />
          <Input label={t('personal.end')} type="date" min={start || undefined} max={isValidKey(start) ? addDays(start, MAX_PERSONAL_RANGE_DAYS - 1) : undefined} value={end} onChange={(event) => setEnd(event.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>{t(error)}</p>}
        <Button type="submit" disabled={!ready}><CalendarOff size={16} />{t('personal.addOffDays')}</Button>
      </form>
      {message && <p role={message.endsWith('Error') ? 'alert' : 'status'} className="text-sm">{t(message)}</p>}
      {!dates.length && !weekdays.length && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('personal.empty')}</p>}
      {(dates.length > 0 || weekdays.length > 0) && <h3 className="text-base font-medium">{t('personal.savedChanges')}</h3>}
      <ul className="divide-y divide-[var(--border)]">
        {[
          ...weekdays.map(([key, rule]) => ({ kind: 'weekdays', key, value: rule, label: `${weekdayName(Number(key), 'long')} · ${formatDate(rule.start)}${rule.end ? ` / ${formatDate(rule.end)}` : ''}`, status: rule.status })),
          ...dates.map(([key, value]) => ({ kind: 'dates', key, value, label: formatDate(key, { day: 'numeric', month: 'short', year: 'numeric' }), status: value })),
        ].map((item) => (
          <li key={`${item.kind}-${item.key}`} className="flex flex-wrap items-center gap-2 py-3">
            <span className="min-w-0 flex-1 text-sm break-words">{item.label}</span>
            <StatusBadge status={item.status} />
            <Button type="button" variant="secondary" size="sm" disabled={!ready} aria-label={`${t('personal.reset')}: ${item.label}`} title={t('personal.reset')} onClick={() => onChange(item.kind, item.key, null)}><RotateCcw size={16} /></Button>
          </li>
        ))}
      </ul>
      {(dates.length > 0 || weekdays.length > 0) && (
        <ConfirmMorph label={t('personal.clear')} icon={<Trash2 size={16} />} prompt={t('personal.clearPrompt')} confirmLabel={t('personal.clear')} cancelLabel={t('common.cancel')} doneLabel={t('personal.cleared')} errorLabel={t('personal.saveError')} retryLabel={t('personal.retry')} disabled={!ready} onConfirm={() => { if (!onClear()) throw new Error('Storage unavailable'); }} />
      )}
    </section>
  );
}