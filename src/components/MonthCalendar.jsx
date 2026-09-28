import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WEEKDAYS, getLocale, toKey, todayKey, weekdayName } from '../lib/schedule';
import { useI18n } from '../lib/i18n';

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1, 12);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toKey(new Date(year, month, d, 12)));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export default function MonthCalendar({ month, onMonthChange, getCellClass, renderExtra, onSelect, selectedKey }) {
  const { t } = useI18n();
  const { year, month: m } = month;
  const cells = buildMonthGrid(year, m);
  const today = todayKey();
  const title = new Date(year, m, 1).toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' });

  const shift = (delta) => {
    const d = new Date(year, m + delta, 1);
    onMonthChange({ year: d.getFullYear(), month: d.getMonth() });
  };

  const navBtn =
    'p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => shift(-1)} className={navBtn} aria-label={t('cal.prev')}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const d = new Date();
            onMonthChange({ year: d.getFullYear(), month: d.getMonth() });
          }}
          className="font-outfit font-bold text-base text-neutral-900 dark:text-neutral-100 capitalize"
        >
          {title}
        </button>
        <button type="button" onClick={() => shift(1)} className={navBtn} aria-label={t('cal.next')}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d.value}
            className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 py-1"
          >
            {weekdayName(d.value)}
          </div>
        ))}
        {cells.map((key, i) =>
          key ? (
            <button
              key={key}
              type="button"
              onClick={() => onSelect?.(key)}
              className={`relative aspect-square sm:aspect-[4/3] rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm font-outfit font-bold transition-all hover:brightness-95 dark:hover:brightness-125 ${getCellClass(key)} ${
                key === today ? 'ring-2 ring-neutral-900 dark:ring-neutral-100' : ''
              } ${selectedKey === key ? 'outline-2 outline-offset-1 outline-dashed outline-neutral-500' : ''}`}
            >
              <span>{Number(key.slice(8))}</span>
              {renderExtra?.(key)}
            </button>
          ) : (
            <div key={`e${i}`} />
          )
        )}
      </div>
    </div>
  );
}
