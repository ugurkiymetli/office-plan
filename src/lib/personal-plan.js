import { addDays, daysBetween, getDayStatus, isoWeekday, isValidKey } from './schedule.js';

export const PERSONAL_PLAN_KEY = 'owp.personal-plan.v1';
export const PERSONAL_STATUSES = ['office', 'home', 'off'];
export const MAX_PERSONAL_RANGE_DAYS = 366;

export function normalizePersonalPlan(raw) {
  const result = { version: 1, teams: {} };
  if (raw?.version !== 1 || !raw.teams || typeof raw.teams !== 'object') return result;
  for (const [teamId, entry] of Object.entries(raw.teams)) {
    if (!entry || typeof entry !== 'object' || ['__proto__', 'constructor', 'prototype'].includes(teamId)) continue;
    const dates = {};
    const weekdays = {};
    for (const [key, status] of Object.entries(entry.dates || {})) {
      if (isValidKey(key) && PERSONAL_STATUSES.includes(status)) dates[key] = status;
    }
    for (const [day, rule] of Object.entries(entry.weekdays || {})) {
      if (!/^[1-7]$/.test(day) || !PERSONAL_STATUSES.includes(rule?.status) || !isValidKey(rule.start)) continue;
      if (rule.end && (!isValidKey(rule.end) || rule.end < rule.start)) continue;
      weekdays[day] = { status: rule.status, start: rule.start, end: rule.end || null };
    }
    if (Object.keys(dates).length || Object.keys(weekdays).length) result.teams[teamId] = { dates, weekdays };
  }
  return result;
}

export function getPersonalDayStatus(plan, personalPlan, key, teamId) {
  const shared = getDayStatus(plan, key, teamId);
  const personal = Object.hasOwn(personalPlan.teams, teamId) ? personalPlan.teams[teamId] : null;
  const dateStatus = personal?.dates[key];
  if (dateStatus) return { ...shared, status: dateStatus, source: 'personal-date' };
  if (shared.source === 'override' || shared.holiday || isoWeekday(key) >= 6) return shared;
  const rule = personal?.weekdays[isoWeekday(key)];
  if (rule && key >= rule.start && (!rule.end || key <= rule.end)) {
    return { ...shared, status: rule.status, source: 'personal-weekday' };
  }
  return shared;
}

export function updatePersonalPlan(personalPlan, teamId, kind, key, value) {
  const entry = personalPlan.teams[teamId] || { dates: {}, weekdays: {} };
  const changes = { ...entry[kind] };
  if (value === null) delete changes[key];
  else changes[key] = value;
  return normalizePersonalPlan({
    version: 1,
    teams: { ...personalPlan.teams, [teamId]: { ...entry, [kind]: changes } },
  });
}

export function addPersonalOffDays(personalPlan, teamId, start, end) {
  if (!isValidKey(start) || !isValidKey(end) || start > end) throw new RangeError('personal.invalidDates');
  const count = daysBetween(start, end) + 1;
  if (count > MAX_PERSONAL_RANGE_DAYS) throw new RangeError('personal.rangeTooLong');
  const entry = personalPlan.teams[teamId] || { dates: {}, weekdays: {} };
  const dates = { ...entry.dates };
  for (let offset = 0; offset < count; offset++) dates[addDays(start, offset)] = 'off';
  return normalizePersonalPlan({
    version: 1,
    teams: { ...personalPlan.teams, [teamId]: { ...entry, dates } },
  });
}