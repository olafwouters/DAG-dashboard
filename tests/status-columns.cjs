'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const api = require('../web/status-columns.js');
const { columns, getActivityColumn } = api;

for (const [status, id, label] of [
  [0, 'request', 'Hulpvraag'],
  [1, 'agreement', 'Afstemming'],
  [2, 'delivery', 'Uitvoering']
]) {
  test(`Planner status ${status} maps to ${label}`, () => {
    assert.deepEqual(getActivityColumn({ status }), { id, label });
  });
}

test('existing completed records default to Follow-up without adding a marker', () => {
  for (const activity of [{ status: 3 }, { status: 3, followUpDone: false },
    { status: 3, followUpDone: undefined }, { status: 3, followUpDone: null }]) {
    const before = Object.getOwnPropertyDescriptors(activity);
    assert.strictEqual(getActivityColumn(activity), columns.followup);
    assert.deepEqual(Object.getOwnPropertyDescriptors(activity), before);
  }
});

test('only explicit boolean true on a completed activity maps to Afgesloten', () => {
  assert.deepEqual(getActivityColumn({ status: 3, followUpDone: true }),
    { id: 'closed', label: 'Afgesloten' });
});

test('status 4 is Niet van toepassing, not the Afgesloten column', () => {
  assert.deepEqual(getActivityColumn({ status: 4 }),
    { id: 'not-applicable', label: 'Niet van toepassing' });
});

test('missing and malformed activities return null without coercion', () => {
  const invalid = [undefined, null, false, true, 0, 3, 3n, '3', Symbol('x'),
    () => {}, [], [3], new Date(), {}, { status: undefined }, { status: null },
    { status: '0' }, { status: '3' }, { status: true }, { status: NaN },
    { status: Infinity }, { status: -Infinity }, { status: -1 },
    { status: 5 }, { status: 2.5 }, { status: new Number(3) }];
  for (const activity of invalid) assert.strictEqual(getActivityColumn(activity), null);
  const array = []; array.status = 0;
  assert.strictEqual(getActivityColumn(array), null);
});

test('malformed follow-up markers do not count as explicitly finished', () => {
  for (const followUpDone of ['true', 'false', '', 0, 1, [], {}, new Boolean(true)]) {
    assert.strictEqual(getActivityColumn({ status: 3, followUpDone }), null);
  }
});

test('a follow-up marker cannot override a non-completed Planner status', () => {
  for (const [status, expected] of [[0, columns.request], [1, columns.agreement],
    [2, columns.delivery], [4, columns.notApplicable]]) {
    assert.strictEqual(getActivityColumn({ status, followUpDone: true }), expected);
  }
});

test('inherited fields do not create an activity or close its follow-up', () => {
  assert.strictEqual(getActivityColumn(Object.create({ status: 0 })), null);
  const activity = Object.create({ followUpDone: true }); activity.status = 3;
  assert.strictEqual(getActivityColumn(activity), columns.followup);
  const record = Object.create(null); record.status = 2;
  assert.strictEqual(getActivityColumn(record), columns.delivery);
});

test('frozen activity and trajectory data are not changed', () => {
  const activity = Object.freeze({ status: 3, followUpDone: true, notes: 'Behouden',
    productSteps: Object.freeze(['Intake', 'Analyse']), productStepIndex: 1 });
  const trajectory = Object.freeze({ phase: '2', owner: 'Olaf', closure: '' });
  const state = Object.freeze({ cells: Object.freeze({ P: Object.freeze({ 10: activity }) }),
    programmeTrajectories: Object.freeze({ P: trajectory }) });
  const before = JSON.stringify(state);
  assert.strictEqual(getActivityColumn(activity), columns.closed);
  assert.equal(JSON.stringify(state), before);
  assert.strictEqual(state.cells.P[10], activity);
  assert.equal(state.programmeTrajectories.P.phase, '2');
});

test('looking up a missing record does not create a cell or default Hulpvraag', () => {
  const state = { cells: { P: {} }, programmeTrajectories: {} };
  const before = JSON.stringify(state);
  assert.strictEqual(getActivityColumn(state.cells.P[10]), null);
  assert.strictEqual(getActivityColumn(state.cells.Q?.[10]), null);
  assert.equal(JSON.stringify(state), before);
  assert.deepEqual(Object.keys(state.cells.P), []);
});

test('browser export works without document, storage, or other app globals', () => {
  const sandbox = {};
  const code = fs.readFileSync(path.join(__dirname, '../web/status-columns.js'), 'utf8');
  vm.runInNewContext(code, sandbox);
  assert.equal(vm.runInNewContext(
    'DAGStatusColumns.getActivityColumn({status:3}).label', sandbox), 'Follow-up');
  assert.equal(vm.runInNewContext(
    'DAGStatusColumns.getActivityColumn({status:3,followUpDone:true}).label', sandbox), 'Afgesloten');
  assert.equal(vm.runInNewContext(
    'DAGStatusColumns.getActivityColumn(undefined)', sandbox), null);
  assert.deepEqual(Object.keys(sandbox), ['DAGStatusColumns']);
});

test('shared column definitions and API cannot be changed by a caller', () => {
  assert(Object.isFrozen(api));
  assert(Object.isFrozen(columns));
  for (const column of Object.values(columns)) assert(Object.isFrozen(column));
  assert.throws(() => { columns.followup.label = 'Wrong'; }, TypeError);
  assert.equal(getActivityColumn({ status: 3 }).label, 'Follow-up');
});
