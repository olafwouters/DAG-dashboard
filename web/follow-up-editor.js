/* Follow-up belongs to the existing activity, never to the trajectory. */
(function (g) {
  'use strict';
  function marker(status, value) { return status === 3 && value === 'true'; }
  g.DAGFollowUpEditor = { marker };
  if (typeof document === 'undefined') return;
  const form = document.getElementById('editForm');
  const label = document.createElement('label');
  label.textContent = 'Follow-up';
  const select = document.createElement('select');
  select.id = 'editFollowUpDone';
  select.innerHTML = '<option value="false">Open — Follow-up</option><option value="true">Klaar — Afgesloten</option>';
  label.append(select);
  form.querySelector('.formgrid').append(label);
  let observedStatus = null;
  function refresh(status) {
    label.hidden = status !== 3;
    select.disabled = !document.documentElement.classList.contains('dag-authenticated') || status !== 3;
  }
  const previousOpen = openEdit;
  openEdit = function (id, b) {
    previousOpen(id, b);
    const activity = state.cells[id]?.[b];
    observedStatus = activity?.status ?? 0;
    select.value = activity?.followUpDone === true ? 'true' : 'false';
    refresh(observedStatus);
  };
  g.DAGFollowUpEditor.read = status => marker(status, select.value);
  form.addEventListener('change', event => {
    if (event.target.id !== 'editStatus') return;
    const status = Number(event.target.value);
    if (status !== observedStatus) select.value = 'false';
    refresh(status);
  }, true);
  // Also handles the existing product-step editor, which saves before autosave.
  const previousSave = save;
  save = function () {
    if (edit && document.getElementById('editDialog').open &&
        document.documentElement.classList.contains('dag-authenticated')) {
      const activity = state.cells[edit.id]?.[edit.b];
      if (activity) {
        if (activity.status !== observedStatus) select.value = 'false';
        activity.followUpDone = marker(activity.status, select.value);
        observedStatus = activity.status;
        refresh(observedStatus);
      }
    }
    return previousSave();
  };
})(globalThis);
