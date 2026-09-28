import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, House, Palmtree, CalendarOff, Moon, CircleDashed, Info } from 'lucide-react';
import { STATUS, TEAM_COLORS, weekdayName } from '../lib/schedule';
import { useI18n } from '../lib/i18n';

export const STATUS_ICONS = {
  office: Building2,
  home: House,
  holiday: Palmtree,
  off: CalendarOff,
  weekend: Moon,
  none: CircleDashed,
};

export const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/80 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all placeholder:text-neutral-400';

export const primaryButton =
  'py-3 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-950 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none';

export const secondaryButton =
  'py-2 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-700';

export const dangerButton =
  'py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-rose-500/20';

export function InfoTip({ text, label }) {
  const { t } = useI18n();
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const tipRef = useRef(null);

  const show = () => {
    const r = btnRef.current.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - width - 8);
    const above = r.bottom + 180 > window.innerHeight && r.top > 180;
    setPos(above ? { bottom: window.innerHeight - r.top + 6, left, width } : { top: r.bottom + 6, left, width });
  };
  const hide = () => setPos(null);

  useEffect(() => {
    if (!pos) return;
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !tipRef.current?.contains(e.target)) hide();
    };
    const onKey = (e) => e.key === 'Escape' && hide();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [pos]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label || t('tip.label')}
        aria-expanded={Boolean(pos)}
        onClick={show}
        onFocus={show}
        onBlur={hide}
        onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
        className="inline-flex items-center justify-center w-5 h-5 shrink-0 rounded-full text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors normal-case"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {pos &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            style={pos}
            className="fixed z-[60] glass-card rounded-xl px-3.5 py-2.5 shadow-xl text-xs leading-relaxed font-medium normal-case tracking-normal whitespace-pre-line text-neutral-700 dark:text-neutral-200 animate-fade-in"
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}

export function Card({ icon: Icon, title, hint, actions, children, className = '' }) {
  return (
    <section
      className={`bg-white dark:bg-neutral-900/40 p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg dark:shadow-2xl animate-fade-in transition-all space-y-5 ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && <Icon className="w-5 h-5 shrink-0 text-neutral-900 dark:text-neutral-100" />}
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-outfit truncate">{title}</h2>
            {hint && <InfoTip text={hint} />}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center gap-1">
        <span className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">{label}</span>
        {hint && <InfoTip text={hint} />}
      </div>
      {children}
    </div>
  );
}

export function StatusBadge({ status, className = '' }) {
  const { t } = useI18n();
  const s = STATUS[status] || STATUS.none;
  const Icon = STATUS_ICONS[status] || CircleDashed;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${s.badge} ${className}`}>
      <Icon className="w-3 h-3" />
      {t(`status.${STATUS[status] ? status : 'none'}`)}
    </span>
  );
}

export function TeamDot({ team, className = 'w-2.5 h-2.5' }) {
  const c = TEAM_COLORS[team?.color] || TEAM_COLORS.neutral;
  return <span className={`inline-block rounded-full ring-1 ring-black/10 dark:ring-white/10 ${c.dot} ${className}`} />;
}

export function TeamBadge({ team }) {
  const c = TEAM_COLORS[team?.color] || TEAM_COLORS.neutral;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold ${c.badge}`}>
      <TeamDot team={team} className="w-2 h-2" />
      {team?.name}
    </span>
  );
}

export function Segmented({ options, value, onChange, size = 'md' }) {
  return (
    <div className="flex bg-neutral-100 dark:bg-neutral-900/60 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800/80">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 ${size === 'sm' ? 'py-1.5 text-[11px]' : 'py-2 text-xs'} rounded-lg font-bold transition-all ${
            value === o.value
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function DayToggles({ value, onChange, days }) {
  const toggle = (d) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort());
  return (
    <div className="flex flex-wrap gap-1.5">
      {days.map((d) => (
        <button
          key={d.value}
          type="button"
          onClick={() => toggle(d.value)}
          className={`min-w-11 px-2.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            value.includes(d.value)
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 border-neutral-900 dark:border-neutral-100'
              : 'bg-neutral-100/80 text-neutral-800 border-neutral-200 dark:bg-neutral-800/60 dark:text-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
          }`}
        >
          {weekdayName(d.value)}
        </button>
      ))}
    </div>
  );
}
