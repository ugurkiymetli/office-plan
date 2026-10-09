'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CalendarCog,
  CalendarDays,
  CloudUpload,
  Copy,
  Download,
  History,
  LogOut,
  Palmtree,
  Pencil,
  Plus,
  RefreshCw,
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
  getLocale,
  isoWeekday,
  normalizePlan,
  parseKey,
  summarizeRotation,
  todayKey,
  uid,
  weekdayName,
} from '../lib/schedule';
import { useI18n } from '../lib/i18n';
import { api } from '../lib/api';
import {
  Card,
  DayToggles,
  Field,
  InfoTip,
  Segmented,
  StatusBadge,
  TeamBadge,
  TeamDot,
} from './ui';
import { Button } from '@/components/arc/button/button';
import { Input } from '@/components/arc/input/input';
import { Checkbox } from '@/components/arc/checkbox/checkbox';
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

function PublishCard({ plan, isDraft, username, onImport, onDiscard, onPublish, onLogout }) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const publish = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await onPublish();
      setMessage({ ok: true, text: t('publish.saved') });
    } catch (err) {
      setMessage({ ok: false, text: err.status === 401 ? t('publish.sessionExpired') : t('publish.saveFailed', { error: err.message }) });
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
      <Button type="button" variant="primary" size="md" onClick={publish} disabled={saving} className="w-full">
        <CloudUpload className="w-4 h-4" /> {saving ? t('publish.saving') : t('publish.toDb')}
      </Button>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={exportPlan}>
          <Download className="w-4 h-4" /> {t('publish.export')}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="w-3.5 h-3.5" /> {t('publish.import')}
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={!isDraft}
          onClick={() => window.confirm(t('publish.discardConfirm')) && onDiscard()}
        >
          <RotateCcw className="w-3.5 h-3.5" /> {t('publish.discard')}
        </Button>
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
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800/80">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{t('publish.signedInAs', { name: username })}</p>
        <Button type="button" variant="secondary" size="sm" onClick={onLogout}>
          <LogOut className="w-3.5 h-3.5" /> {t('publish.logout')}
        </Button>
      </div>
    </Card>
  );
}

/* ---------------------------- History ---------------------------- */

function HistoryCard({ refreshKey, onLoad }) {
  const { t } = useI18n();
  const [versions, setVersions] = useState(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    setError(null);
    try {
      setVersions(await api('/api/plan/versions'));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    refresh();
  }, [refreshKey]);

  const load = async (id) => {
    if (!window.confirm(t('history.loadConfirm'))) return;
    try {
      onLoad(await api(`/api/plan/versions/${id}`));
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card
      icon={History}
      title={t('history.title')}
      hint={t('history.hint')}
      actions={
        <Button type="button" variant="secondary" size="sm" aria-label={t('history.refresh')} onClick={refresh}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      }
    >
      {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{t('history.failed', { error })}</p>}
      {!versions && !error && <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('app.loading')}</p>}
      <ul className="space-y-2 max-h-80 overflow-y-auto">
        {versions?.map((v, i) => (
          <li key={v.id} className={listItem}>
            <div className="min-w-0">
              <p className="font-outfit font-bold text-sm truncate">
                {new Date(v.createdAt).toLocaleString(getLocale(), { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('history.by', { name: v.createdBy || '—' })}
                {i === 0 ? ` · ${t('history.current')}` : ''}
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" disabled={i === 0} onClick={() => load(v.id)}>
              <RotateCcw className="w-3.5 h-3.5" /> {t('history.load')}
            </Button>
          </li>
        ))}
        {versions && !versions.length && <li className="text-sm text-neutral-500 dark:text-neutral-400">{t('history.empty')}</li>}
      </ul>
      {loaded && <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t('history.loaded')}</p>}
    </Card>
  );
}

/* ----------------------------- Teams ----------------------------- */

function TeamsCard({ plan, updatePlan }) {
  const { t } = useI18n();
  const setColor = (id, color) =>
    updatePlan((p) => ({ ...p, teams: p.teams.map((tm) => (tm.id === id ? { ...tm, color } : tm)) }));

  return (
    <Card icon={Users} title={t('teams.title')} hint={t('teams.hint')}>
      <div className="grid sm:grid-cols-2 gap-4">
        {plan.teams.map((team) => {
          const otherColor = plan.teams.find((tm) => tm.id !== team.id)?.color;
          return (
            <div key={team.id} className="space-y-3 p-4 rounded-xl border bg-neutral-100/80 border-neutral-200 dark:bg-neutral-800/60 dark:border-neutral-800">
              <TeamBadge team={team} />
              <Field label={t('teams.color')} hint={t('teams.colorHint')}>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TEAM_COLORS).map(([key, c]) => (
                    <button
                      key={key}
                      type="button"
                      title={t(`color.${key}`)}
                      aria-label={t(`color.${key}`)}
                      disabled={key === otherColor}
                      onClick={() => setColor(team.id, key)}
                      className={`w-8 h-8 rounded-full ring-1 ring-black/10 dark:ring-white/10 disabled:opacity-25 disabled:pointer-events-none ${c.dot} ${
                        team.color === key ? 'outline-2 outline-offset-2 outline-neutral-900 dark:outline-neutral-100' : ''
                      }`}
                    />
                  ))}
                </div>
              </Field>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* --------------------------- Rotations --------------------------- */

const PRESETS = [
  { id: 'split3', firstHalf: [1, 2, 3], secondHalf: [3, 4, 5], alternate: true },
  { id: 'split2', firstHalf: [1, 2], secondHalf: [4, 5], alternate: true },
  { id: 'full', firstHalf: [1, 2, 3, 4, 5], secondHalf: [], alternate: true },
];

function presetLabel(p, t) {
  return p.id === 'full' ? t('rot.fullWeeks') : `${formatDayList(p.firstHalf)} / ${formatDayList(p.secondHalf)}`;
}

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
  const { t, teamName } = useI18n();
  const [copied, setCopied] = useState(false);
  const runs = summarizeRotation(rotation, plan.teams);
  const nameOf = (id) => teamName(plan.teams.find((tm) => tm.id === id));
  const text = runs.map((r) => `${formatRange(r.start, r.end)}: ${nameOf(r.teamId)}`).join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt(t('rot.copyPrompt'), text);
    }
  };

  if (!runs.length) return <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('rot.noOffice')}</p>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">{t('rot.preview')}</p>
          <InfoTip text={t('rot.previewTip')} />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={copy}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t('rot.copied') : t('rot.copy')}
        </Button>
      </div>
      <ul className="space-y-1">
        {runs.slice(0, limit).map((r) => {
          const team = plan.teams.find((tm) => tm.id === r.teamId);
          return (
            <li key={`${r.start}-${r.teamId}`} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatRange(r.start, r.end)}</span>
              <TeamBadge team={team} />
            </li>
          );
        })}
      </ul>
      {runs.length > limit && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('rot.more', { n: runs.length - limit })}</p>
      )}
    </div>
  );
}

function RotationForm({ plan, initial, onSave, onCancel }) {
  const { t, teamName } = useI18n();
  const [form, setForm] = useState(initial);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const valid = Boolean(form.start && form.end && form.start <= form.end && (form.firstHalf.length || form.secondHalf.length));

  return (
    <div className="space-y-4 p-4 rounded-xl border bg-neutral-100/80 border-neutral-200 dark:bg-neutral-800/60 dark:border-neutral-800 animate-fade-in">
      <Field label={t('rot.name')} hint={t('rot.nameHint')}>
        <Input value={form.name} maxLength={80} placeholder={t('rot.namePlaceholder')} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('rot.start')} hint={t('rot.startHint')}>
          <Input type="date" value={form.start} onChange={(e) => set({ start: e.target.value })} />
        </Field>
        <Field label={t('rot.end')} hint={t('rot.endHint')}>
          <Input type="date" value={form.end} onChange={(e) => set({ end: e.target.value })} />
        </Field>
      </div>

      <Field
        label={t('rot.quick')}
        hint={t('rot.quickHint', {
          split3: presetLabel(PRESETS[0], t),
          split2: presetLabel(PRESETS[1], t),
          full: presetLabel(PRESETS[2], t),
        })}
      >
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p.id} type="button" variant="secondary" size="sm" onClick={() => set({ firstHalf: p.firstHalf, secondHalf: p.secondHalf, alternate: p.alternate })}>
              <Wand2 className="w-3.5 h-3.5" /> {presetLabel(p, t)}
            </Button>
          ))}
        </div>
      </Field>

      <Field label={t('rot.startTeam')} hint={t('rot.startTeamHint')}>
        <Segmented
          options={plan.teams.map((tm) => ({ value: tm.id, label: teamName(tm), icon: <TeamDot team={tm} /> }))}
          value={form.startTeamId}
          onChange={(v) => set({ startTeamId: v })}
        />
      </Field>

      <Field label={t('rot.firstHalf')} hint={t('rot.firstHalfHint')}>
        <DayToggles days={WEEKDAYS} value={form.firstHalf} onChange={(v) => set({ firstHalf: v })} />
      </Field>
      <Field label={t('rot.secondHalf')} hint={t('rot.secondHalfHint')}>
        <DayToggles days={WEEKDAYS} value={form.secondHalf} onChange={(v) => set({ secondHalf: v })} />
      </Field>

      <div className="flex items-start gap-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={form.alternate} onCheckedChange={(checked) => set({ alternate: Boolean(checked) })} />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            <b>{t('rot.swap')}</b> — {t('rot.swapDesc')}
          </span>
        </label>
        <InfoTip text={t('rot.swapTip')} />
      </div>

      {form.firstHalf.some((d) => form.secondHalf.includes(d)) && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('rot.overlap', { days: formatDayList(form.firstHalf.filter((d) => form.secondHalf.includes(d))) })}
        </p>
      )}

      {valid && daysBetween(form.start, form.end) <= 800 && (
        <RotationSummary rotation={form} plan={plan} limit={8} />
      )}

      <div className="flex gap-2">
        <Button type="button" variant="primary" size="md" disabled={!valid} className="flex-1" onClick={() => onSave({ ...form, id: form.id || uid(), name: form.name.trim() || t('rot.defaultName', { date: formatDate(form.start) }) })}>
          <Check className="w-4 h-4" /> {t('rot.save')}
        </Button>
        <Button type="button" variant="secondary" size="md" className="px-4" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
      {!valid && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{t('rot.invalid')}</p>
      )}
    </div>
  );
}

function RotationsCard({ plan, updatePlan }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(null);

  const save = (rotation) => {
    updatePlan((p) => {
      const exists = p.rotations.some((r) => r.id === rotation.id);
      return { ...p, rotations: exists ? p.rotations.map((r) => (r.id === rotation.id ? rotation : r)) : [...p.rotations, rotation] };
    });
    setEditing(null);
  };

  const remove = (id) =>
    window.confirm(t('rot.deleteConfirm')) && updatePlan((p) => ({ ...p, rotations: p.rotations.filter((r) => r.id !== id) }));

  return (
    <Card
      icon={Repeat}
      title={t('rot.title')}
      hint={t('rot.hint')}
      actions={
        !editing && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(emptyRotation(plan))}>
            <Plus className="w-3.5 h-3.5" /> {t('rot.new')}
          </Button>
        )
      }
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('rot.desc')}</p>

      {editing && <RotationForm key={editing.id || 'new'} plan={plan} initial={editing} onSave={save} onCancel={() => setEditing(null)} />}

      <ul className="space-y-2">
        {plan.rotations.map((r) => {
          const startTeam = plan.teams.find((tm) => tm.id === r.startTeamId);
          return (
            <li key={r.id} className={listItem}>
              <div className="min-w-0 space-y-1">
                <p className="font-outfit font-bold text-sm truncate">{r.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDate(r.start)} → {formatDate(r.end)} · {formatDayList(r.firstHalf, t('common.none'))} / {formatDayList(r.secondHalf, t('common.none'))}
                  {r.alternate ? ` · ${t('rot.weeklySwap')}` : ''}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  {t('rot.startsWith')} <TeamBadge team={startTeam} />
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button type="button" variant="secondary" size="sm" aria-label={t('common.edit')} onClick={() => setEditing(r)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button type="button" variant="danger" size="sm" aria-label={t('common.delete')} onClick={() => remove(r.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
        {!plan.rotations.length && !editing && (
          <li className="text-sm text-neutral-500 dark:text-neutral-400">{t('rot.empty')}</li>
        )}
      </ul>
    </Card>
  );
}

/* ---------------------------- Holidays ---------------------------- */

function HolidaysCard({ plan, updatePlan }) {
  const { t } = useI18n();
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
    <Card icon={Palmtree} title={t('hol.title')} hint={t('hol.hint')}>
      <form onSubmit={add} className="space-y-3">
        <Field label={t('hol.name')} hint={t('hol.nameHint')}>
          <Input value={form.name} maxLength={80} placeholder={t('hol.namePlaceholder')} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('hol.from')} hint={t('hol.fromHint')}>
            <Input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </Field>
          <Field label={t('hol.to')} hint={t('hol.toHint')}>
            <Input type="date" value={form.end} min={form.start} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </Field>
        </div>
        <Button type="submit" variant="primary" size="md" disabled={!valid} className="w-full">
          <Plus className="w-4 h-4" /> {t('hol.add')}
        </Button>
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
            <Button type="button" variant="danger" size="sm" aria-label={t('common.delete')} onClick={() => remove(h.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </li>
        ))}
        {!plan.holidays.length && <li className="text-sm text-neutral-500 dark:text-neutral-400">{t('hol.empty')}</li>}
      </ul>
    </Card>
  );
}

/* ---------------------------- Calendar ---------------------------- */

const BULK_STATUS = ['office', 'home', 'off', 'auto'];

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
  const { t, teamName } = useI18n();
  const [month, setMonth] = useState(() => {
    const d = parseKey(todayKey());
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
    const teamIds = bulk.team === 'all' ? plan.teams.map((tm) => tm.id) : [bulk.team];
    updatePlan((p) => ({ ...p, overrides: applyOverrides(p.overrides, dates, teamIds, bulk.status) }));
    setBulkMsg(dates.length === 1 ? t('calc.updatedOne') : t('calc.updated', { n: dates.length }));
  };

  const overrideKeys = Object.keys(plan.overrides).sort();
  const clearAll = () =>
    window.confirm(t('calc.clearConfirm')) && updatePlan((p) => ({ ...p, overrides: {} }));

  const cellClass = (k) => {
    const statuses = plan.teams.map((tm) => getDayStatus(plan, k, tm.id).status);
    if (statuses.every((s) => s === 'holiday' || s === 'off')) return STATUS.holiday.cell;
    if (statuses.every((s) => s === 'weekend')) return STATUS.weekend.cell;
    if (statuses.every((s) => s === 'none')) return STATUS.none.cell;
    return 'bg-neutral-100/80 text-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-200';
  };

  return (
    <Card
      icon={CalendarDays}
      title={t('calc.title')}
      hint={t('calc.hint')}
      actions={
        overrideKeys.length > 0 && (
          <Button type="button" variant="danger" size="sm" onClick={clearAll}>
            <Trash2 className="w-3.5 h-3.5" /> {t('calc.clear', { n: overrideKeys.length })}
          </Button>
        )
      }
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('calc.desc')}</p>
      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        selectedKey={selected}
        onSelect={setSelected}
        getCellClass={cellClass}
        renderExtra={(k) => (
          <span className="flex items-center gap-0.5 h-1.5">
            {plan.teams.map((tm) =>
              getDayStatus(plan, k, tm.id).status === 'office' ? <TeamDot key={tm.id} team={tm} className="w-1.5 h-1.5" /> : null
            )}
            {plan.overrides[k] && <span className="w-1 h-1 rounded-full bg-neutral-500" />}
          </span>
        )}
      />
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
        {plan.teams.map((tm) => (
          <span key={tm.id} className="inline-flex items-center gap-1.5">
            <TeamDot team={tm} className="w-2 h-2" /> {t('schedule.inOffice', { team: teamName(tm) })}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" /> {t('calc.manualChange')}
        </span>
        <StatusBadge status="holiday" />
      </div>

      <form onSubmit={applyBulk} className="space-y-3 p-4 rounded-xl border bg-neutral-100/80 border-neutral-200 dark:bg-neutral-800/60 dark:border-neutral-800">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
          <CalendarCog className="w-4 h-4" /> {t('calc.range')}
          <InfoTip text={t('calc.rangeTip')} />
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('calc.from')} hint={t('calc.fromHint')}>
            <Input type="date" value={bulk.start} onChange={(e) => setBulk({ ...bulk, start: e.target.value })} />
          </Field>
          <Field label={t('calc.to')} hint={t('calc.toHint')}>
            <Input type="date" value={bulk.end} min={bulk.start} onChange={(e) => setBulk({ ...bulk, end: e.target.value })} />
          </Field>
        </div>
        <Field label={t('calc.team')} hint={t('calc.teamHint')}>
          <Segmented
            size="sm"
            options={[{ value: 'all', label: t('calc.both') }, ...plan.teams.map((tm) => ({ value: tm.id, label: teamName(tm) }))]}
            value={bulk.team}
            onChange={(v) => setBulk({ ...bulk, team: v })}
          />
        </Field>
        <Field label={t('calc.setTo')} hint={t('calc.setToHint')}>
          <Segmented
            size="sm"
            options={BULK_STATUS.map((value) => ({ value, label: t(`override.${value}`) }))}
            value={bulk.status}
            onChange={(v) => setBulk({ ...bulk, status: v })}
          />
        </Field>
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
            <Checkbox checked={bulk.weekdaysOnly} onCheckedChange={(checked) => setBulk({ ...bulk, weekdaysOnly: Boolean(checked) })} />
            {t('calc.weekdaysOnly')}
          </label>
          <InfoTip text={t('calc.weekdaysOnlyTip')} />
        </div>
        <Button type="submit" variant="primary" size="md" disabled={!bulkValid} className="w-full">
          <Check className="w-4 h-4" /> {t('calc.apply')}
        </Button>
        {bulkMsg && <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{bulkMsg}</p>}
      </form>

      <DayDetailSheet plan={plan} dateKey={selected} onClose={() => setSelected(null)} editable onSetOverride={setOverride} />
    </Card>
  );
}

export default function AdminView({ plan, isDraft, username, updatePlan, replacePlan, discardDraft, publishPlan, logout }) {
  const { t } = useI18n();
  const [section, setSection] = useState('rotations');
  const sections = ['rotations', 'holidays', 'calendar', 'settings'].map((value) => ({ value, label: t(`admin.${value}`) }));

  return (
    <div className="space-y-6">
      <Segmented options={sections} value={section} onChange={setSection} />
      {section === 'rotations' && <RotationsCard plan={plan} updatePlan={updatePlan} />}
      {section === 'holidays' && <HolidaysCard plan={plan} updatePlan={updatePlan} />}
      {section === 'calendar' && <CalendarCard plan={plan} updatePlan={updatePlan} />}
      {section === 'settings' && (
        <>
          <TeamsCard plan={plan} updatePlan={updatePlan} />
          <PublishCard
            plan={plan}
            isDraft={isDraft}
            username={username}
            onImport={replacePlan}
            onDiscard={discardDraft}
            onPublish={publishPlan}
            onLogout={logout}
          />
          <HistoryCard refreshKey={isDraft ? 'draft' : plan.updatedAt} onLoad={replacePlan} />
        </>
      )}
      {isDraft && section !== 'settings' && (
        <button
          type="button"
          onClick={() => setSection('settings')}
          className={`w-full p-3 rounded-xl border text-xs font-semibold text-left ${STATUS.holiday.badge}`}
        >
          {t('admin.draftBanner')}
        </button>
      )}
    </div>
  );
}
