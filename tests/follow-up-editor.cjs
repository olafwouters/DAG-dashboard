'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { test } = require('node:test');
const code = fs.readFileSync(require('node:path').join(__dirname, '../web/follow-up-editor.js'), 'utf8');
function setup(activity) {
  const handlers = {}, nodes = {}, children = [];
  nodes.editForm = { querySelector: () => ({ append: n => children.push(n) }),
    addEventListener: (name, fn) => handlers[name] = fn };
  nodes.editDialog = { open: true };
  let saves = 0;
  const state = { cells: { P: { 0: activity } }, programmeTrajectories: { P: { phase: '1' } } };
  const context = { state, edit: { id: 'P', b: 0 },
    openEdit: () => {}, save: () => saves++, document: {
      documentElement: { classList: { contains: () => true } },
      getElementById: id => nodes[id],
      createElement: () => ({ append: n => nodes[n.id] = n }) } };
  vm.createContext(context); vm.runInContext(code, context);
  context.openEdit('P', 0);
  return { context, state, nodes, handlers, children, saves: () => saves };
}
test('completed legacy record opens with follow-up open, without mutation', () => {
  const a = { status: 3, notes: 'Keep' }, s = setup(a);
  assert.equal(s.nodes.editFollowUpDone.value, 'false');
  assert(!Object.hasOwn(a, 'followUpDone')); assert.equal(s.children[0].hidden, false);
});
test('ordinary save preserves a closed marker and other activity/trajectory fields', () => {
  const a = { status: 3, followUpDone: true, notes: 'Keep', productSteps: ['Keep'] }, s = setup(a);
  s.context.save(); assert.equal(a.followUpDone, true); assert.equal(a.notes, 'Keep');
  assert.equal(s.state.programmeTrajectories.P.phase, '1'); assert.equal(s.saves(), 1);
});
test('open/klaar choice updates only follow-up on the same record', () => {
  const a = { status: 3 }, s = setup(a);
  s.nodes.editFollowUpDone.value = 'true'; s.context.save(); assert.equal(a.followUpDone, true);
  s.nodes.editFollowUpDone.value = 'false'; s.context.save(); assert.equal(a.followUpDone, false);
  assert.strictEqual(s.state.cells.P[0], a); assert.equal(a.status, 3);
});
test('reopen and complete again cannot reuse a closed marker, including product steps', () => {
  const a = { status: 3, followUpDone: true }, s = setup(a);
  a.status = 2; s.context.save(); assert.equal(a.followUpDone, false);
  assert.equal(s.children[0].hidden, true);
  a.status = 3; s.context.save(); assert.equal(a.followUpDone, false);
});
test('status event resets selection before shared capture runs', () => {
  const s = setup({ status: 3, followUpDone: true });
  s.handlers.change({ target: { id: 'editStatus', value: '2' } });
  assert.equal(s.nodes.editFollowUpDone.value, 'false');
  assert.equal(s.context.DAGFollowUpEditor.read(3), false);
});
test('missing record is not created; closed dialog cannot change a record', () => {
  const s = setup(undefined); s.context.save(); assert.equal(s.state.cells.P[0], undefined);
  const t = setup({ status: 3, followUpDone: true }); t.nodes.editDialog.open = false;
  t.nodes.editFollowUpDone.value = 'false'; t.context.save();
  assert.equal(t.state.cells.P[0].followUpDone, true);
});
