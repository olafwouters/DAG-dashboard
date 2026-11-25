'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), { test } = require('node:test');
function setup() {
  const menu = { options: [0,1,2,3,4].map(value => ({ value: String(value) })) };
  const legend = {}, state = { cells: { P: { 0: { status: 3, followUpDone: true } } } };
  const context = { state, edit: null, visible: () => [], renderPlanner: () => {},
    openEdit: () => { context.edit = { id: 'P', b: 0 }; },
    document: { getElementById: id => id === 'editStatus' ? menu : legend } };
  vm.createContext(context);
  for (const name of ['status-columns.js','planner-labels.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../web', name), 'utf8'), context);
  }
  return { context, menu, legend, state };
}
test('all activity labels use the shared translation including open/closed follow-up', () => {
  const { context } = setup(), label = context.DAGPlannerLabels.label;
  assert.deepEqual([0,1,2,3,4].map(status => label({ status })),
    ['Hulpvraag','Afstemming','Uitvoering','Follow-up','Niet van toepassing']);
  assert.equal(label({ status: 3, followUpDone: false }), 'Follow-up');
  assert.equal(label({ status: 3, followUpDone: true }), 'Afgesloten');
});
test('missing or invalid input cannot be presented as a new Hulpvraag', () => {
  const { context } = setup(), label = context.DAGPlannerLabels.label;
  assert.equal(label(undefined), 'Geen activiteit'); assert.equal(label(null), 'Geen activiteit');
  for (const a of [{}, { status: '3' }, { status: 5 }, { status: 3, followUpDone: 'true' }])
    assert.equal(label(a), 'Ongeldige invoer');
});
test('menu values remain numeric; label follows the existing marker after open and render', () => {
  const s = setup(); s.context.DAGPlannerLabels.install();
  assert.deepEqual(s.menu.options.map(o => o.value), ['0','1','2','3','4']);
  s.context.openEdit('P', 0); assert.equal(s.menu.options[3].textContent, 'Afgesloten');
  s.state.cells.P[0].followUpDone = false; s.context.renderPlanner([]);
  assert.equal(s.menu.options[3].textContent, 'Follow-up');
});
test('legend includes all six stages; installing and rendering do not alter data', () => {
  const s = setup(), before = JSON.stringify(s.state);
  s.context.DAGPlannerLabels.install(); s.context.openEdit('P', 0); s.context.renderPlanner([]);
  for (const label of ['Hulpvraag','Afstemming','Uitvoering','Follow-up','Afgesloten','Niet van toepassing'])
    assert(s.legend.innerHTML.includes(label));
  assert.equal(JSON.stringify(s.state), before);
});
