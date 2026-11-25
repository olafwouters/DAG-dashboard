'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { groupActivities, planActivityMove, columnList } = require('../web/status-containers.js');
const fixture = () => ({ programs: [{ id: 'P', name: 'Opleiding A' }, { id: 'Q' }],
  buckets: [{ id: 0, name: 'Kennismakingsgesprek' }, { id: 1, name: 'Curriculumadvies' }],
  cells: { P: { 0: { status: 1, owner: 'Olaf', notes: 'Bewaren', due: '2026-12-01' },
    1: { status: 1 } } }, programmeTrajectories: { P: { phase: '1', closure: '', request: 'Bewaren' } } });
const lane = (model, id) => model.lanes.find(l => l.column.id === id);
const move = (s, b, target) => planActivityMove(s, 'P', b, target, '2026-11-25', '2026-11-25T08:00:00Z');

test('one container per programme and stage; direct references, no changes', () => {
  const s = fixture(), before = JSON.stringify(s), m = groupActivities(s);
  assert.equal(m.programmes, 1); assert.equal(m.activities, 2);
  const c = lane(m, 'agreement').containers[0];
  assert.strictEqual(c.programme, s.programs[0]);
  assert.strictEqual(c.items[0].activity, s.cells.P[0]);
  assert.equal(c.items.length, 2); assert.equal(JSON.stringify(s), before);
});
test('move one activity, retain source until last activity leaves', () => {
  const s = fixture(), original = s.cells.P[0], other = s.cells.P[1];
  const before = JSON.stringify(s), plan = move(s, 0, 'delivery');
  assert.equal(JSON.stringify(s), before); assert.strictEqual(plan.previous, original);
  s.cells.P[0] = plan.next;
  let m = groupActivities(s);
  assert.equal(lane(m, 'agreement').containers[0].items.length, 1);
  assert.equal(lane(m, 'delivery').containers[0].items.length, 1);
  assert.strictEqual(s.cells.P[1], other);
  s.cells.P[1] = move(s, 1, 'delivery').next;
  m = groupActivities(s);
  assert.equal(lane(m, 'agreement').containers.length, 0);
  assert.equal(lane(m, 'delivery').containers.length, 1);
  assert.equal(lane(m, 'delivery').containers[0].items.length, 2);
  assert.equal(m.programmes, 1); assert.equal(m.activities, 2);
  assert.deepEqual(Object.keys(s.cells.P), ['0', '1']);
});
test('all six stages share labels and closed/open follow-up are distinct', () => {
  assert.deepEqual(columnList.map(c => c.label), ['Hulpvraag', 'Afstemming', 'Uitvoering',
    'Follow-up', 'Afgesloten', 'Niet van toepassing']);
  for (const [target, status, closed] of [['request', 0, false], ['agreement', 1, false],
    ['delivery', 2, false], ['followup', 3, false], ['closed', 3, true], ['not-applicable', 4, false]]) {
    const s = fixture(); s.cells.P[0].status = target === 'delivery' ? 1 : 2;
    s.cells.P[0] = move(s, 0, target).next;
    assert.equal(s.cells.P[0].status, status);
    assert.equal(s.cells.P[0].followUpDone, closed);
    assert(lane(groupActivities(s, { includeNotApplicable: true }), target)
      .containers[0].items.some(i => i.bucket.id === 0));
  }
  const s = fixture(); s.cells.P[0] = { status: 3 };
  assert.equal(lane(groupActivities(s), 'followup').activities, 1);
  s.cells.P[0].followUpDone = false;
  assert.equal(lane(groupActivities(s), 'followup').activities, 1);
  s.cells.P[0].followUpDone = true;
  assert.equal(lane(groupActivities(s), 'closed').activities, 1);
});
test('moves preserve other fields and formal trajectory; invalidate stale product step', () => {
  const s = fixture(), trajectory = JSON.stringify(s.programmeTrajectories);
  s.cells.P[0].productSteps = [{ name: 'Intake', status: 1 }]; s.cells.P[0].productStepIndex = 0;
  const plan = move(s, 0, 'closed');
  assert.equal(plan.next.owner, 'Olaf'); assert.equal(plan.next.notes, 'Bewaren');
  assert.equal(plan.next.due, '2026-12-01'); assert.equal(plan.next.done, '2026-11-25');
  assert.strictEqual(plan.next.productSteps, s.cells.P[0].productSteps);
  assert(!Object.hasOwn(plan.next, 'productStepIndex'));
  assert.equal(JSON.stringify(s.programmeTrajectories), trajectory);
  s.cells.P[0] = plan.next;
  s.cells.P[0] = move(s, 0, 'delivery').next;
  assert.equal(s.cells.P[0].followUpDone, false); assert.equal(s.cells.P[0].done, '');
  s.cells.P[0] = move(s, 0, 'followup').next;
  assert.equal(s.cells.P[0].followUpDone, false);
});
test('missing, invalid, inherited and deleted records cannot create work', () => {
  const s = fixture(); delete s.cells.P[0]; s.cells.Q = { 99: { status: 2 } };
  const before = JSON.stringify(s);
  assert.equal(move(s, 0, 'delivery'), null);
  assert.equal(planActivityMove(s, 'Q', 99, 'delivery'), null);
  assert.equal(groupActivities(s).activities, 1);
  s.cells.P[1] = { status: '1' };
  assert.equal(groupActivities(s).invalid, 1); assert.equal(groupActivities(s).activities, 0);
  assert.equal(move(s, 1, 'delivery'), null);
  s.cells.P = Object.create({ 1: { status: 1 } });
  assert.equal(groupActivities(s).activities, 0); assert.equal(move(s, 1, 'delivery'), null);
  assert(!Object.hasOwn(s.cells.P, 0));
  for (const bad of [null, undefined, false, {}, { programs: [], buckets: [], cells: null }]) {
    assert.equal(groupActivities(bad).activities, 0);
    assert.equal(planActivityMove(bad, 'P', 0, 'delivery'), null);
  }
});
test('N.v.t. separately visible and excluded from applicable totals; scope is shared', () => {
  const s = fixture(); s.cells.P[0].status = 4;
  let m = groupActivities(s);
  assert.equal(m.notApplicable, 1); assert.equal(m.activities, 1);
  assert.equal(lane(m, 'not-applicable').containers.length, 0);
  m = groupActivities(s, { includeNotApplicable: true });
  assert.equal(lane(m, 'not-applicable').activities, 1); assert.equal(m.activities, 1);
  assert.equal(groupActivities(s, { programmeIds: ['Q'] }).programmes, 0);
});
test('invalid targets/dates do not mutate; same stage is a no-op', () => {
  const s = fixture(), before = JSON.stringify(s);
  assert.equal(move(s, 0, 'overdue'), null);
  assert.equal(planActivityMove(s, 'P', 0, 'delivery', '2026-02-30', '2026-11-25'), null);
  assert.equal(planActivityMove(s, 'P', 0, 'delivery', '2026-11-25', 'bad'), null);
  const plan = move(s, 0, 'agreement');
  assert.equal(plan.changed, false); assert.strictEqual(plan.next, s.cells.P[0]);
  assert.equal(JSON.stringify(s), before);
});
