import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultPlan } from './schedule.js';
import { addPersonalOffDays, getPersonalDayStatus, normalizePersonalPlan, updatePersonalPlan } from './personal-plan.js';

const empty = () => normalizePersonalPlan(null);
const weekdayRule = { status: 'home', start: '2026-10-12', end: '2026-10-26' };

test('personal rules respect precedence, boundaries and team isolation', () => {
  const plan = createDefaultPlan();
  const original = JSON.stringify(plan);
  let personal = updatePersonalPlan(empty(), 'red', 'weekdays', '1', weekdayRule);
  assert.equal(getPersonalDayStatus(plan, personal, '2026-10-12', 'red').source, 'personal-weekday');
  assert.equal(getPersonalDayStatus(plan, personal, '2026-10-26', 'red').source, 'personal-weekday');
  assert.equal(getPersonalDayStatus(plan, personal, '2026-10-05', 'red').source, 'rotation');
  assert.equal(getPersonalDayStatus(plan, personal, '2026-11-02', 'red').source, 'rotation');
  assert.equal(getPersonalDayStatus(plan, personal, '2026-10-12', 'white').source, 'rotation');
  assert.equal(JSON.stringify(plan), original);
  plan.holidays.push({ start: '2026-10-12', end: '2026-10-12', name: 'Holiday' });
  assert.equal(getPersonalDayStatus(plan, personal, '2026-10-12', 'red').status, 'holiday');
  plan.overrides['2026-10-12'] = { red: 'off' };
  assert.equal(getPersonalDayStatus(plan, personal, '2026-10-12', 'red').status, 'off');
  personal = updatePersonalPlan(personal, 'red', 'dates', '2026-10-12', 'office');
  assert.equal(getPersonalDayStatus(plan, personal, '2026-10-12', 'red').source, 'personal-date');
  personal = updatePersonalPlan(personal, 'red', 'dates', '2026-10-12', null);
  assert.equal(getPersonalDayStatus(plan, personal, '2026-10-12', 'red').status, 'off');
});

test('weekday rules preserve weekends; specific dates can change them', () => {
  const plan = createDefaultPlan();
  let personal = updatePersonalPlan(empty(), 'red', 'weekdays', '6', { ...weekdayRule, end: null });
  assert.equal(getPersonalDayStatus(plan, personal, '2026-10-17', 'red').status, 'weekend');
  personal = updatePersonalPlan(personal, 'red', 'dates', '2026-10-17', 'office');
  assert.equal(getPersonalDayStatus(plan, personal, '2026-10-17', 'red').status, 'office');
  personal = updatePersonalPlan(personal, 'red', 'weekdays', '6', null);
  personal = updatePersonalPlan(personal, 'red', 'dates', '2026-10-17', null);
  assert.deepEqual(personal, empty());
});

test('normalization rejects corrupt values and round-trips saved changes', () => {
  const personal = updatePersonalPlan(empty(), 'red', 'weekdays', '1', weekdayRule);
  assert.deepEqual(normalizePersonalPlan(JSON.parse(JSON.stringify(personal))), personal);
  for (const raw of [null, [], 'invalid', { version: 2, teams: {} }]) assert.deepEqual(normalizePersonalPlan(raw), empty());
  assert.deepEqual(normalizePersonalPlan({ version: 1, teams: { red: {
    dates: { '2026-02-30': 'office', '2026-10-12': 'invalid' },
    weekdays: { 1: { ...weekdayRule, end: '2026-01-01' }, 8: weekdayRule },
  } } }), empty());
});

test('personal changes survive baseline updates without mutating either plan', () => {
  const plan = createDefaultPlan();
  const personal = updatePersonalPlan(empty(), 'red', 'dates', '2026-10-12', 'home');
  const updated = updatePersonalPlan(personal, 'white', 'dates', '2026-10-13', 'off');
  assert.equal(personal.teams.white, undefined);
  assert.equal(updated.teams.red.dates['2026-10-12'], 'home');
  plan.rotations = [];
  assert.equal(getPersonalDayStatus(plan, updated, '2026-10-12', 'red').status, 'home');
  assert.equal(getPersonalDayStatus(plan, updated, '2026-10-13', 'red').status, 'none');
  assert.equal(getPersonalDayStatus(plan, updated, '2026-10-13', 'white').status, 'off');
});

test('normalization handles malformed entries and prototype keys', () => {
  const raw = JSON.parse('{"version":1,"teams":{"__proto__":{"dates":{"2026-10-12":"office"}},"red":{"weekdays":{"1":null,"2":17},"dates":false}}}');
  assert.deepEqual(normalizePersonalPlan(raw), empty());
});

test('off-day ranges include both endpoints, cross months and preserve other changes', () => {
  let original = updatePersonalPlan(empty(), 'red', 'dates', '2026-10-29', 'office');
  original = updatePersonalPlan(original, 'white', 'dates', '2026-10-30', 'home');
  original = updatePersonalPlan(original, 'red', 'weekdays', '1', weekdayRule);
  const updated = addPersonalOffDays(original, 'red', '2026-10-30', '2026-11-02');
  assert.deepEqual(updated.teams.red.dates, {
    '2026-10-29': 'office', '2026-10-30': 'off', '2026-10-31': 'off', '2026-11-01': 'off', '2026-11-02': 'off',
  });
  assert.deepEqual(updated.teams.white, original.teams.white);
  assert.deepEqual(updated.teams.red.weekdays, original.teams.red.weekdays);
  assert.equal(original.teams.red.dates['2026-10-30'], undefined);
});

test('off-day ranges handle single dates, leap days and year boundaries', () => {
  assert.deepEqual(addPersonalOffDays(empty(), 'red', '2026-10-12', '2026-10-12').teams.red.dates, { '2026-10-12': 'off' });
  assert.deepEqual(Object.keys(addPersonalOffDays(empty(), 'red', '2028-02-28', '2028-03-01').teams.red.dates), ['2028-02-28', '2028-02-29', '2028-03-01']);
  assert.deepEqual(Object.keys(addPersonalOffDays(empty(), 'red', '2026-12-31', '2027-01-01').teams.red.dates), ['2026-12-31', '2027-01-01']);
  assert.deepEqual(addPersonalOffDays(empty(), 'red', '9999-12-31', '9999-12-31').teams.red.dates, { '9999-12-31': 'off' });
});

test('invalid and oversized off-day ranges are rejected before changing the plan', () => {
  const original = empty();
  for (const [start, end] of [['', '2026-10-12'], ['2026-02-30', '2026-03-01'], ['2026-10-13', '2026-10-12']]) {
    assert.throws(() => addPersonalOffDays(original, 'red', start, end), /personal.invalidDates/);
  }
  assert.equal(Object.keys(addPersonalOffDays(original, 'red', '2026-01-01', '2027-01-01').teams.red.dates).length, 366);
  assert.throws(() => addPersonalOffDays(original, 'red', '2026-01-01', '2027-01-02'), /personal.rangeTooLong/);
  assert.deepEqual(original, empty());
});