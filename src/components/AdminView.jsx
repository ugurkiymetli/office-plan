import { useRef, useState } from 'react';
import {
  CalendarCog,
  CalendarDays,
  CloudUpload,
  Copy,
  Download,
  Palmtree,
  Pencil,
  Plus,
  Repeat,
  RotateCcw,
  Trash2,
  Upload,
  Users,
  Wand2,
  Check,
} from 'lucide-react';
import {
  STATUS,
  TEAM_COLORS,
  WEEKDAYS,
  addDays,
  daysBetween,
  formatDate,
  formatRange,
  getDayStatus,
  isoWeekday,
  normalizePlan,
  parseKey,
  summarizeRotation,
  todayKey,
  uid,
  weekdayName,
} from '../lib/schedule';
import { useI18n } from '../lib/i18n';
import {
  Card,
  DayToggles,
  Field,
  InfoTip,
  Segmented,
  StatusBadge,
  TeamBadge,
  TeamDot,
  dangerButton,
  inputClass,
  primaryButton,
  secondaryButton,
} from './ui';
import MonthCalendar from './MonthCalendar';
import DayDetailSheet from './DayDetailSheet';

const listItem =
  'flex items-center justify-between gap-3 p-3 rounded-xl border bg-neutral-100/80 text-neutral-800 border-neutral-200 dark:bg-neutral-800/60 dark:text-neutral-200 dark:border-neutral-800';

function formatDayList(days, noneLabel = '') {
  if (!days.length) return noneLabel;
  const names = days.map((d) => weekdayName(d));
  const contiguous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  return contiguous && days.length > 1 ? `${names[0]}–${names[names.length - 1]}` : names.join(', ');
}

/* ---------------------------- Publish ---------------------------- */

function PublishCard({ plan, isDraft, onImport, onDiscard, onPublish }) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [message, setMessage] = useState(null);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const publish = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onPublish(password);
      setMessage({ ok: true, text: t('publish.saved') });
    } catch (err) {
      if (err.status === 401) setPassword('');
      setMessage({ ok: false, text: t(err.status === 401 ? 'publish.unauthorized' : 'publish.saveFailed', { error: err.message }) });
    } finally {
      setSaving(false);
    }
  };

  const exportPlan = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plan.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPlan = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setMessage({ ok: false, text: t('publish.tooLarge') });
      return;
    }
    try {
      onImport(normalizePlan(JSON.parse(await file.text())));
      setMessage({ ok: true, text: t('publish.imported') });
    } catch (err) {
      setMessage({ ok: false, text: t('publish.importFailed', { error: err.message }) });
    }
  };

  return (
    <Card
      icon={Upload}
      title={t('publish.title')}
      hint={t('publish.hint')}
      actions={
        <span
          className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${
            isDraft ? STATUS.holiday.badge : STATUS.office.badge
          }`}
        >
          {isDraft ? t('publish.draft') : t('publish.published')}
        </span>
      }
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('publish.text')}</p>
      <form onSubmit={publish} className="flex flex-col sm:flex-row gap-2">
        <input
          type="password"
          className={`${inputClass} sm:flex-1`}
          value={password}
          autoComplete="current-password"
          placeholder={t('publish.password')}
          aria-label={t('publish.password')}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={!password || saving} className={`${primaryButton} disabled:opacity-40 disabled:pointer-events-none`}>
          <CloudUpload className="w-4 h-4" /> {saving ? t('publish.saving') : t('publish.toDb')}
        </button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button type="button" onClick={exportPlan} className={`${secondaryButton} py-3`}>
          <Download className="w-4 h-4" /> {t('publish.export')}
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className={`${secondaryButton} py-3`}>
          <Upload className="w-3.5 h-3.5" /> {t('publish.import')}
        </button>
        <button
          type="button"
          disabled={!isDraft}
          onClick={() => window.confirm(t('publish.discardConfirm')) && onDiscard()}
          className={`${dangerButton} py-3 disabled:opacity-40 disabled:pointer-events-none`}
        >
          <RotateCcw className="w-3.5 h-3.5" /> {t('publish.discard')}
        </button>
      </div>
      <ul className="space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        {['export', 'import', 'discard'].map((k) => (
          <li key={k} className="flex items-center gap-1">
            <InfoTip text={t(`publish.${k}Tip`)} />
            <span>
              <b>{t(`publish.${k}Short`)}</b> — {t(`publish.${k}Line`)}
            </span>
          </li>
        ))}
      </ul>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importPlan} />
      {message && (
        <p className={`text-xs font-semibold ${message.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {message.text}
        </p>
      )}
    </Card>
  );
}

/* ----------------------------- Teams ----------------------------- */

function TeamsCard({ plan, updatePlan }) {
  const { t } = useI18n();
  const setTeam = (id, patch) =>
    updatePlan((p) => ({ ...p, teams: p.teams.map((tm) => (tm.id === id ? { ...tm, ...patch } : tm)) }));

  return (
    <Card icon={Users} title={t('teams.title')} hint={t('teams.hint')}>
      <div className="grid sm:grid-cols-2 gap-4">
        {plan.teams.map((team) => (
          <div key={team.id} className="space-y-3 p-4 rounded-xl border bg-neutral-100/80 border-neutral-200 dark:bg-neutral-800/60 dark:border-neutral-800">
            <Field label={t('teams.name')} hint={t('teams.nameHint')}>
              <input
                className={inputClass}
                value={team.name}
                maxLength={40}
                onChange={(e) => setTeam(team.id, { name: e.target.value })}
              />
            </Field>
            <Field label={t('teams.color')} hint={t('teams.colorHint')}>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TEAM_COLORS).map(([key, c]) => (
                <button
                  key={key}
                  type="button"
                  title={t(`color.${key}`)}
                  aria-label={t(`color.${key}`)}
                  onClick={() => setTeam(team.id, { color: key })}
                  className={`w-8 h-8 rounded-full ring-1 ring-black/10 dark:ring-white/10 ${c.dot} ${
                    team.color === key ? 'outline-2 outline-offset-2 outline-neutral-900 dark:outline-neutral-100' : ''
                  }`}
                />
              ))}
            </div>
            </Field>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* --------------------------- Rotations --------------------------- */

const PRESETS = [
  { label: 'Mon–Wed / Wed–Fri', firstHalf: [1, 2, 3], secondHalf: [3, 4, 5], alternate: true },
  { label: 'Mon–Tue / Thu–Fri', firstHalf: [1, 2], secondHalf: [4, 5], alternate: true },
  { label: 'Full weeks', firstHalf: [1, 2, 3, 4, 5], secondHalf: [], alternate: true },
];

function emptyRotation(plan) {
  const start = todayKey();
  const d = parseKey(start);
  return {
    id: null,
    name: '',
    start,
    end: `${d.getFullYear()}-12-31`,
    startTeamId: plan.teams[0].id,
    firstHalf: [1, 2, 3],
    secondHalf: [3, 4, 5],
    alternate: true,
  };
}

function RotationSummary({ rotation, plan, limit }) {
  const [copied, setCopied] = useState(false);
  const runs = summarizeRotation(rotation, plan.teams);
  const teamName = (id) => plan.teams.find((t) => t.id === id)?.name;
  const text = runs.map((r) => `${formatRange(r.start, r.end)}: ${teamName(r.teamId)}`).join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy the schedule:', text);
    }
  };

  if (!runs.length) return <p className="text-xs text-neutral-500 dark:text-neutral-400">No office days in this range.</p>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Preview</p>
          <InfoTip text="Office periods this rotation creates. Holidays and manual day changes aren't included. 'Copy as text' copies the full list in the same format as the manager's email." />
        </div>
        <button type="button" onClick={copy} className={secondaryButton}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy as text'}
        </button>
      </div>
      <ul className="space-y-1">
        {runs.slice(0, limit).map((r) => {
          const team = plan.teams.find((t) => t.id === r.teamId);
          return (
            <li key={`${r.start}-${r.teamId}`} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatRange(r.start, r.end)}</span>
              <TeamBadge team={team} />
            </li>
          );
        })}
      </ul>
      {runs.length > limit && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">…and {runs.length - limit} more periods. Use "Copy as text" for the full list.</p>
      )}
    </div>
  );
}

function RotationForm({ plan, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const valid = Boolean(form.start && form.end && form.start <= form.end && (form.firstHalf.length || form.secondHalf.length));

  return (
    <div className="space-y-4 p-4 rounded-xl border bg-neutral-100/80 border-neutral-200 dark:bg-neutral-800/60 dark:border-neutral-800 animate-fade-in">
      <Field label="Name" hint="Only shown in the admin list to help you tell rotations apart. If you leave it empty, a name is made from the start date.">
        <input className={inputClass} value={form.name} maxLength={80} placeholder="e.g. Q4 rotation" onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start" hint="First day of the rotation. Weeks are counted from the week this date falls in, so it can be any weekday (e.g. Thursday, October 1).">
          <input type="date" className={inputClass} value={form.start} onChange={(e) => set({ start: e.target.value })} />
        </Field>
        <Field label="End" hint="Last day of the rotation. Days after it use another rotation, or show 'Not planned' if none covers them.">
          <input type="date" className={inputClass} value={form.end} onChange={(e) => set({ end: e.target.value })} />
        </Field>
      </div>

      <Field
        label="Quick pattern"
        hint={
          <>
            Fills in the weekdays below. You can still change them afterwards.
            <br />• <b>Mon–Wed / Wed–Fri</b>: split week, both teams in on Wednesday.
            <br />• <b>Mon–Tue / Thu–Fri</b>: split week, nobody in on Wednesday.
            <br />• <b>Full weeks</b>: one team comes in all week, then the teams swap.
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className={secondaryButton} onClick={() => set({ firstHalf: p.firstHalf, secondHalf: p.secondHalf, alternate: p.alternate })}>
              <Wand2 className="w-3.5 h-3.5" /> {p.label}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Team in office on the start date"
        hint="The team that works on the first day. If the start date falls in the second half of the week (e.g. Thursday), this team takes the second half of that week and the first half of the next week."
      >
        <Segmented
          options={plan.teams.map((t) => ({ value: t.id, label: t.name, icon: <TeamDot team={t} /> }))}
          value={form.startTeamId}
          onChange={(v) => set({ startTeamId: v })}
        />
      </Field>

      <Field label="First half of the week (leading team)" hint="Office days for the team that leads the week. With weekly swap on, this is the team that also worked at the end of the previous week.">
        <DayToggles days={WEEKDAYS} value={form.firstHalf} onChange={(v) => set({ firstHalf: v })} />
      </Field>
      <Field label="Second half of the week (other team)" hint="Office days for the other team. A day selected in both halves is an overlap day, when both teams are in the office.">
        <DayToggles days={WEEKDAYS} value={form.secondHalf} onChange={(v) => set({ secondHalf: v })} />
      </Field>

      <div className="flex items-start gap-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-0.5 w-4 h-4 accent-neutral-900 dark:accent-neutral-100" checked={form.alternate} onChange={(e) => set({ alternate: e.target.checked })} />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            <b>Swap teams every week</b> — the team that finished a week starts the next one.
          </span>
        </label>
        <InfoTip text="On: the teams switch halves every week (Red Mon–Wed, then White Mon–Wed the next week, and so on). Off: each team keeps the same days every week." />
      </div>

      {form.firstHalf.some((d) => form.secondHalf.includes(d)) && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Overlap day: {formatDayList(form.firstHalf.filter((d) => form.secondHalf.includes(d)))} — both teams in office.
        </p>
      )}

      {valid && daysBetween(form.start, form.end) <= 800 && (
        <RotationSummary rotation={form} plan={plan} limit={8} />
      )}

      <div className="flex gap-2">
        <button type="button" disabled={!valid} className={`${primaryButton} flex-1`} onClick={() => onSave({ ...form, id: form.id || uid(), name: form.name.trim() || `Rotation from ${formatDate(form.start)}` })}>
          <Check className="w-4 h-4" /> Save rotation
        </button>
        <button type="button" className={`${secondaryButton} px-4`} onClick={onCancel}>
          Cancel
        </button>
      </div>
      {!valid && (
        <p className="text-xs text-rose-600 dark:text-rose-400">Pick a valid date range and at least one office day.</p>
      )}
    </div>
  );
}

function RotationsCard({ plan, updatePlan }) {
  const [editing, setEditing] = useState(null);

  const save = (rotation) => {
    updatePlan((p) => {
      const exists = p.rotations.some((r) => r.id === rotation.id);
      return { ...p, rotations: exists ? p.rotations.map((r) => (r.id === rotation.id ? rotation : r)) : [...p.rotations, rotation] };
    });
    setEditing(null);
  };

  const remove = (id) =>
    window.confirm('Delete this rotation?') && updatePlan((p) => ({ ...p, rotations: p.rotations.filter((r) => r.id !== id) }));

  return (
    <Card
      icon={Repeat}
      title="Recurring rotations"
      hint="Create a weekly office pattern once and it repeats until the end date. Use the pencil to edit or the bin to delete a rotation. Holidays and manual day changes always take priority."
      actions={
        !editing && (
          <button type="button" className={secondaryButton} onClick={() => setEditing(emptyRotation(plan))}>
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        )
      }
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        A rotation repeats a weekly office pattern between two dates. If rotations overlap, the one lower in the list wins.
      </p>

      {editing && <RotationForm key={editing.id || 'new'} plan={plan} initial={editing} onSave={save} onCancel={() => setEditing(null)} />}

      <ul className="space-y-2">
        {plan.rotations.map((r) => {
          const startTeam = plan.teams.find((t) => t.id === r.startTeamId);
          return (
            <li key={r.id} className={listItem}>
              <div className="min-w-0 space-y-1">
                <p className="font-outfit font-bold text-sm truncate">{r.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDate(r.start)} → {formatDate(r.end)} · {formatDayList(r.firstHalf)} / {formatDayList(r.secondHalf)}
                  {r.alternate ? ' · weekly swap' : ''}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  Starts with <TeamBadge team={startTeam} />
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button type="button" className={secondaryButton} aria-label="Edit" onClick={() => setEditing(r)}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button type="button" className={dangerButton} aria-label="Delete" onClick={() => remove(r.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          );
        })}
        {!plan.rotations.length && !editing && (
          <li className="text-sm text-neutral-500 dark:text-neutral-400">No rotations yet. Tap "New" to create one.</li>
        )}
      </ul>
    </Card>
  );
}

/* ---------------------------- Holidays ---------------------------- */

function HolidaysCard({ plan, updatePlan }) {
  const [form, setForm] = useState({ name: '', start: '', end: '' });
  const valid = form.name.trim() && form.start && (!form.end || form.end >= form.start);

  const add = (e) => {
    e.preventDefault();
    if (!valid) return;
    const holiday = { id: uid(), name: form.name.trim(), start: form.start, end: form.end || form.start };
    updatePlan((p) => ({ ...p, holidays: [...p.holidays, holiday].sort((a, b) => a.start.localeCompare(b.start)) }));
    setForm({ name: '', start: '', end: '' });
  };

  const remove = (id) => updatePlan((p) => ({ ...p, holidays: p.holidays.filter((h) => h.id !== id) }));

  return (
    <Card icon={Palmtree} title="Holidays" hint="Holidays apply to both teams and replace the rotation on those days. To give only one team a day off, use Calendar → 'Off' instead.">
      <form onSubmit={add} className="space-y-3">
        <Field label="Holiday name" hint="Shown to users on the day, e.g. 'Republic Day' or 'New Year'.">
          <input className={inputClass} value={form.name} maxLength={80} placeholder="e.g. Republic Day" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" hint="First day of the holiday.">
            <input type="date" className={inputClass} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </Field>
          <Field label="To (optional)" hint="Leave empty for a one-day holiday. Set it to mark several days in a row, e.g. a long holiday or bridge days.">
            <input type="date" className={inputClass} value={form.end} min={form.start} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </Field>
        </div>
        <button type="submit" disabled={!valid} className={`${primaryButton} w-full`}>
          <Plus className="w-4 h-4" /> Add holiday
        </button>
      </form>

      <ul className="space-y-2">
        {plan.holidays.map((h) => (
          <li key={h.id} className={listItem}>
            <div className="min-w-0">
              <p className="font-outfit font-bold text-sm truncate">{h.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {h.start === h.end ? formatDate(h.start) : `${formatDate(h.start)} → ${formatDate(h.end)}`}
              </p>
            </div>
            <button type="button" className={dangerButton} aria-label="Delete" onClick={() => remove(h.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
        {!plan.holidays.length && <li className="text-sm text-neutral-500 dark:text-neutral-400">No holidays added.</li>}
      </ul>
    </Card>
  );
}

/* ---------------------------- Calendar ---------------------------- */

const BULK_STATUS = [
  { value: 'office', label: 'Office' },
  { value: 'home', label: 'Home' },
  { value: 'off', label: 'Off' },
  { value: 'auto', label: 'Auto' },
];

function applyOverrides(overrides, dates, teamIds, value) {
  const next = { ...overrides };
  for (const k of dates) {
    const entry = { ...(next[k] || {}) };
    for (const id of teamIds) {
      if (value === 'auto') delete entry[id];
      else entry[id] = value;
    }
    if (Object.keys(entry).length) next[k] = entry;
    else delete next[k];
  }
  return next;
}

function CalendarCard({ plan, updatePlan }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState(null);
  const [bulk, setBulk] = useState({ start: '', end: '', team: 'all', status: 'off', weekdaysOnly: true });
  const [bulkMsg, setBulkMsg] = useState('');

  const setOverride = (key, teamId, value) =>
    updatePlan((p) => ({ ...p, overrides: applyOverrides(p.overrides, [key], [teamId], value || 'auto') }));

  const bulkValid = bulk.start && bulk.end && bulk.start <= bulk.end && daysBetween(bulk.start, bulk.end) <= 366;

  const applyBulk = (e) => {
    e.preventDefault();
    if (!bulkValid) return;
    const dates = [];
    for (let k = bulk.start; k <= bulk.end; k = addDays(k, 1)) {
      if (!bulk.weekdaysOnly || isoWeekday(k) <= 5) dates.push(k);
    }
    const teamIds = bulk.team === 'all' ? plan.teams.map((t) => t.id) : [bulk.team];
    updatePlan((p) => ({ ...p, overrides: applyOverrides(p.overrides, dates, teamIds, bulk.status) }));
    setBulkMsg(`Updated ${dates.length} day${dates.length === 1 ? '' : 's'}.`);
  };

  const overrideKeys = Object.keys(plan.overrides).sort();
  const clearAll = () =>
    window.confirm('Remove all manual day changes?') && updatePlan((p) => ({ ...p, overrides: {} }));

  const cellClass = (k) => {
    const statuses = plan.teams.map((t) => getDayStatus(plan, k, t.id).status);
    if (statuses.every((s) => s === 'holiday' || s === 'off')) return STATUS.holiday.cell;
    if (statuses.every((s) => s === 'weekend')) return STATUS.weekend.cell;
    if (statuses.every((s) => s === 'none')) return STATUS.none.cell;
    return 'bg-neutral-100/80 text-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-200';
  };

  return (
    <Card
      icon={CalendarDays}
      title="Calendar & day changes"
      hint="Manual changes override the rotation and holidays for one team on one day. The 'Clear' button removes all manual changes and goes back to the rotation."
      actions={
        overrideKeys.length > 0 && (
          <button type="button" className={dangerButton} onClick={clearAll}>
            <Trash2 className="w-3.5 h-3.5" /> Clear {overrideKeys.length}
          </button>
        )
      }
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Dots show which teams are in the office. Tap a day to change it manually (e.g. sick leave, extra office day).
      </p>
      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        selectedKey={selected}
        onSelect={setSelected}
        getCellClass={cellClass}
        renderExtra={(k) => (
          <span className="flex items-center gap-0.5 h-1.5">
            {plan.teams.map((t) =>
              getDayStatus(plan, k, t.id).status === 'office' ? <TeamDot key={t.id} team={t} className="w-1.5 h-1.5" /> : null
            )}
            {plan.overrides[k] && <span className="w-1 h-1 rounded-full bg-neutral-500" />}
          </span>
        )}
      />
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
        {plan.teams.map((t) => (
          <span key={t.id} className="inline-flex items-center gap-1.5">
            <TeamDot team={t} className="w-2 h-2" /> {t.name} in office
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" /> Manual change
        </span>
        <StatusBadge status="holiday" />
      </div>

      <form onSubmit={applyBulk} className="space-y-3 p-4 rounded-xl border bg-neutral-100/80 border-neutral-200 dark:bg-neutral-800/60 dark:border-neutral-800">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
          <CalendarCog className="w-4 h-4" /> Change a date range
          <InfoTip text="Applies the same manual change to many days at once, e.g. a team offsite week or a period when everyone works from home." />
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" hint="First day to change.">
            <input type="date" className={inputClass} value={bulk.start} onChange={(e) => setBulk({ ...bulk, start: e.target.value })} />
          </Field>
          <Field label="To" hint="Last day to change (included). The range can be up to one year.">
            <input type="date" className={inputClass} value={bulk.end} min={bulk.start} onChange={(e) => setBulk({ ...bulk, end: e.target.value })} />
          </Field>
        </div>
        <Field label="Team" hint="Choose which team the change applies to, or 'Both' to change both teams.">
          <Segmented
            size="sm"
            options={[{ value: 'all', label: 'Both' }, ...plan.teams.map((t) => ({ value: t.id, label: t.name }))]}
            value={bulk.team}
            onChange={(v) => setBulk({ ...bulk, team: v })}
          />
        </Field>
        <Field
          label="Set to"
          hint={
            <>
              • <b>Office</b>: in the office, whatever the rotation says.
              <br />• <b>Home</b>: working from home.
              <br />• <b>Off</b>: day off for that team only (leave, team event).
              <br />• <b>Auto</b>: removes manual changes so the rotation and holidays apply again.
            </>
          }
        >
          <Segmented size="sm" options={BULK_STATUS} value={bulk.status} onChange={(v) => setBulk({ ...bulk, status: v })} />
        </Field>
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-neutral-900 dark:accent-neutral-100" checked={bulk.weekdaysOnly} onChange={(e) => setBulk({ ...bulk, weekdaysOnly: e.target.checked })} />
            Weekdays only
          </label>
          <InfoTip text="When checked, Saturdays and Sundays in the range are skipped. Uncheck it to schedule weekend work." />
        </div>
        <button type="submit" disabled={!bulkValid} className={`${primaryButton} w-full`}>
          <Check className="w-4 h-4" /> Apply
        </button>
        {bulkMsg && <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{bulkMsg}</p>}
      </form>

      <DayDetailSheet plan={plan} dateKey={selected} onClose={() => setSelected(null)} editable onSetOverride={setOverride} />
    </Card>
  );
}

export default function AdminView({ plan, isDraft, updatePlan, replacePlan, discardDraft, publishPlan }) {
  const [section, setSection] = useState('rotations');
  const sections = [
    { value: 'rotations', label: 'Rotations' },
    { value: 'holidays', label: 'Holidays' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'settings', label: 'Setup' },
  ];

  return (
    <div className="space-y-6">
      <Segmented options={sections} value={section} onChange={setSection} />
      {section === 'rotations' && <RotationsCard plan={plan} updatePlan={updatePlan} />}
      {section === 'holidays' && <HolidaysCard plan={plan} updatePlan={updatePlan} />}
      {section === 'calendar' && <CalendarCard plan={plan} updatePlan={updatePlan} />}
      {section === 'settings' && (
        <>
          <TeamsCard plan={plan} updatePlan={updatePlan} />
          <PublishCard plan={plan} isDraft={isDraft} onImport={replacePlan} onDiscard={discardDraft} onPublish={publishPlan} />
        </>
      )}
      {isDraft && section !== 'settings' && (
        <button
          type="button"
          onClick={() => setSection('settings')}
          className={`w-full p-3 rounded-xl border text-xs font-semibold text-left ${STATUS.holiday.badge}`}
        >
          You have unpublished changes saved on this device. Open Setup → Export plan.json to share them.
        </button>
      )}
    </div>
  );
}
