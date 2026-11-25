/* Planner presentation only; numeric storage statuses remain unchanged. */
(function (g) {
  'use strict';
  const C = g.DAGStatusColumns;
  function label(activity) {
    if (activity == null) return 'Geen activiteit';
    return C.getActivityColumn(activity)?.label || 'Ongeldige invoer';
  }
  function install() {
    const menu = document.getElementById('editStatus');
    function refreshMenu() {
      const current = edit ? state.cells[edit.id]?.[edit.b] : null;
      const columns = [C.columns.request, C.columns.agreement, C.columns.delivery,
        current?.status === 3 && current.followUpDone === true ? C.columns.closed : C.columns.followup,
        C.columns.notApplicable];
      for (const option of menu.options) option.textContent = columns[Number(option.value)].label;
    }
    document.getElementById('legend1').innerHTML = Object.values(C.columns).map((column, i) =>
      '<span><i class="dot" style="background:' +
      ['#e4e4e8','#8098b4','#d6aa72','#80a38a','#285f63','#bdbdc3'][i] +
      '"></i>' + column.label + '</span>').join('') + '<span>Deadline verstreken</span>';
    const priorOpen = openEdit;
    openEdit = function (id, bucket) { priorOpen(id, bucket); refreshMenu(); };
    const priorRender = renderPlanner;
    renderPlanner = function (programmes) { priorRender(programmes); refreshMenu(); };
    refreshMenu();
    renderPlanner(visible());
  }
  g.DAGPlannerLabels = Object.freeze({ label, install });
})(globalThis);
