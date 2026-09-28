// Dates are handled as local "YYYY-MM-DD" keys to avoid timezone drift.

const LOCALES = { en: 'en-US', tr: 'tr-TR' };
let locale = LOCALES.en;

export function setLocale(lang) {
  locale = LOCALES[lang] || LOCALES.en;
}

export function getLocale() {
  return locale;
}

export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7].map((value) => ({ value }));

// 2024-01-01 is a Monday, so day N of that week has ISO weekday N.
export function weekdayName(value, style = 'short') {
  return new Date(2024, 0, value, 12).toLocaleDateString(locale, { weekday: style });
}

export const TEAM_COLORS = {
  rose: { dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  neutral: { dot: 'bg-neutral-300 dark:bg-neutral-100', badge: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-200 border-neutral-500/20' },
  sky: { dot: 'bg-sky-500', badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  amber: { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  violet: { dot: 'bg-violet-500', badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
};

export const STATUS = {
  office: { cell: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  home: { cell: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  holiday: { cell: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  off: { cell: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  weekend: { cell: 'text-neutral-400 dark:text-neutral-600', badge: 'bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20' },
  none: { cell: 'text-neutral-500 dark:text-neutral-400', badge: 'bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20' },
};

const pad = (n) => String(n).padStart(2, '0');

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

// Fixed office time zone so server-rendered and browser-rendered "today" match.
const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE || 'Europe/Istanbul';
const zonedKeyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

export function toZonedKey(date) {
  return zonedKeyFormat.format(date);
}

export function todayKey() {
  return toZonedKey(new Date());
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function isoWeekday(key) {
  const day = parseKey(key).getDay();
  return day === 0 ? 7 : day;
}

export function mondayOf(key) {
  return addDays(key, 1 - isoWeekday(key));
}

export function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function isValidKey(key) {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && toKey(parseKey(key)) === key;
}

export function formatDate(key, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return parseKey(key).toLocaleDateString(locale, opts);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function otherTeamId(teams, id) {
  return teams.find((t) => t.id !== id)?.id;
}

// Returns team ids in the office for the date, or null if the rotation doesn't cover it.
export function rotationOfficeTeams(rotation, key, teams) {
  if (key < rotation.start || key > rotation.end) return null;
  const wd = isoWeekday(key);
  const weekIdx = Math.floor(daysBetween(mondayOf(rotation.start), mondayOf(key)) / 7);
  const startWd = isoWeekday(rotation.start);
  const firstLead = rotation.firstHalf.includes(startWd)
    ? rotation.startTeamId
    : otherTeamId(teams, rotation.startTeamId);
  const lead = rotation.alternate && weekIdx % 2 === 1 ? otherTeamId(teams, firstLead) : firstLead;
  const result = [];
  if (rotation.firstHalf.includes(wd)) result.push(lead);
  if (rotation.secondHalf.includes(wd)) result.push(otherTeamId(teams, lead));
  return result;
}

// Consecutive office runs per team, e.g. [{ start: '2026-10-01', end: '2026-10-02', teamId: 'red' }, ...].
export function summarizeRotation(rotation, teams) {
  const runs = [];
  const open = {};
  for (let k = rotation.start; k <= rotation.end; k = addDays(k, 1)) {
    const inOffice = rotationOfficeTeams(rotation, k, teams);
    for (const t of teams) {
      if (inOffice.includes(t.id)) {
        if (open[t.id] && open[t.id].end === addDays(k, -1)) open[t.id].end = k;
        else runs.push((open[t.id] = { start: k, end: k, teamId: t.id }));
      }
    }
  }
  const order = teams.map((t) => t.id);
  return runs.sort((a, b) => a.start.localeCompare(b.start) || order.indexOf(a.teamId) - order.indexOf(b.teamId));
}

export function formatRange(start, end) {
  const s = parseKey(start);
  const e = parseKey(end);
  const month = (d) => d.toLocaleDateString(locale, { month: 'long' });
  if (locale.startsWith('tr')) {
    if (start === end) return `${s.getDate()} ${month(s)}`;
    if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${month(s)}`;
    return `${s.getDate()} ${month(s)} – ${e.getDate()} ${month(e)}`;
  }
  if (start === end) return `${month(s)} ${s.getDate()}`;
  if (s.getMonth() === e.getMonth()) return `${month(s)} ${s.getDate()}–${e.getDate()}`;
  return `${month(s)} ${s.getDate()} – ${month(e)} ${e.getDate()}`;
}

export function findHoliday(plan, key) {
  return plan.holidays.find((h) => key >= h.start && key <= (h.end || h.start));
}

function findRotation(plan, key) {
  for (let i = plan.rotations.length - 1; i >= 0; i--) {
    const r = plan.rotations[i];
    if (key >= r.start && key <= r.end) return r;
  }
  return null;
}

export function getDayStatus(plan, key, teamId) {
  const override = plan.overrides[key]?.[teamId];
  const holiday = findHoliday(plan, key);
  if (override) return { status: override, source: 'override', holiday };
  if (holiday) return { status: 'holiday', source: 'holiday', holiday };

  const wd = isoWeekday(key);
  const rotation = findRotation(plan, key);
  if (rotation) {
    const inOffice = rotationOfficeTeams(rotation, key, plan.teams);
    if (inOffice.includes(teamId)) return { status: 'office', source: 'rotation', rotation };
    if (wd >= 6) return { status: 'weekend', source: 'rotation', rotation };
    return { status: 'home', source: 'rotation', rotation };
  }
  if (wd >= 6) return { status: 'weekend', source: 'default' };
  return { status: 'none', source: 'default' };
}

export function createDefaultPlan() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    teams: [
      { id: 'red', color: 'rose' },
      { id: 'white', color: 'neutral' },
    ],
    rotations: [
      {
        id: 'q4-2026',
        name: 'Oct–Dec 2026 rotation',
        start: '2026-10-01',
        end: '2026-12-31',
        startTeamId: 'red',
        firstHalf: [1, 2, 3],
        secondHalf: [3, 4, 5],
        alternate: true,
      },
    ],
    holidays: [],
    overrides: {},
  };
}

const VALID_OVERRIDES = ['office', 'home', 'off'];

function toDayList(v) {
  return Array.isArray(v) ? [...new Set(v.map(Number).filter((n) => n >= 1 && n <= 7))].sort() : [];
}

// Sanitizes untrusted plan JSON (imported files / plan.json / localStorage).
export function normalizePlan(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Plan must be a JSON object.');
  if (!Array.isArray(raw.teams) || raw.teams.length !== 2) throw new Error('Plan must contain exactly 2 teams.');

  // Team names are derived from the color (see teamName in i18n), so colors must differ.
  const teams = raw.teams.map((t, i) => ({
    id: String(t?.id || `team${i + 1}`).slice(0, 40),
    color: TEAM_COLORS[t?.color] ? t.color : i === 0 ? 'rose' : 'neutral',
  }));
  if (teams[0].id === teams[1].id) throw new Error('Team ids must be unique.');
  if (teams[1].color === teams[0].color) teams[1].color = Object.keys(TEAM_COLORS).find((c) => c !== teams[0].color);
  const teamIds = teams.map((t) => t.id);

  const rotations = (Array.isArray(raw.rotations) ? raw.rotations : [])
    .filter((r) => r && isValidKey(r.start) && isValidKey(r.end) && r.start <= r.end)
    .map((r) => ({
      id: String(r.id || uid()),
      name: String(r.name || 'Rotation').slice(0, 80),
      start: r.start,
      end: r.end,
      startTeamId: teamIds.includes(r.startTeamId) ? r.startTeamId : teamIds[0],
      firstHalf: toDayList(r.firstHalf),
      secondHalf: toDayList(r.secondHalf),
      alternate: r.alternate !== false,
    }));

  const holidays = (Array.isArray(raw.holidays) ? raw.holidays : [])
    .filter((h) => h && isValidKey(h.start) && (!h.end || (isValidKey(h.end) && h.end >= h.start)))
    .map((h) => ({ id: String(h.id || uid()), name: String(h.name || 'Holiday').slice(0, 80), start: h.start, end: h.end || h.start }))
    .sort((a, b) => a.start.localeCompare(b.start));

  const overrides = {};
  if (raw.overrides && typeof raw.overrides === 'object') {
    for (const [key, val] of Object.entries(raw.overrides)) {
      if (!isValidKey(key) || !val || typeof val !== 'object') continue;
      const entry = {};
      for (const id of teamIds) if (VALID_OVERRIDES.includes(val[id])) entry[id] = val[id];
      if (Object.keys(entry).length) overrides[key] = entry;
    }
  }

  return {
    version: 1,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    teams,
    rotations,
    holidays,
    overrides,
  };
}
