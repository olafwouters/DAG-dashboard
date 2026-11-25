/* Planner presentation only; numeric storage statuses remain unchanged. */
(function (g) {
  'use strict';
  const C = g.DAGStatusColumns;
  const palette = ['#8f2635','#d46b75','#ee7f00','#469766','#185b3b','#8b9195'];
  function label(activity) {
    if (activity == null) return 'Geen activiteit';
    return C.getActivityColumn(activity)?.label || 'Ongeldige invoer';
  }
  function install() {
    const menu = document.getElementById('editStatus');
    const style = document.createElement('style');
    style.textContent = 'html body #plannerTable .pname,html body #plannerTable .bucket-name{font-size:var(--dag-text,12px)!important;font-weight:600;line-height:1.45}html body #plannerTable .cluster button{font-size:var(--dag-card-heading,14px)!important;font-weight:700;line-height:1.4}#plannerTable .cellbtn[data-dag-column]{border:1px solid var(--dag-edge,#d8dcdf);border-left:5px solid var(--dag-accent,#8b9195);background:var(--dag-fill,#f3f4f5)!important;color:var(--dag-ink,#454b50)!important}#plannerTable .cellbtn[data-dag-column=request]{--dag-fill:#f0ccd1;--dag-edge:#cc8e98;--dag-accent:#8f2635;--dag-ink:#5d1521}#plannerTable .cellbtn[data-dag-column=agreement]{--dag-fill:#fae0e3;--dag-edge:#df9aa3;--dag-accent:#d46b75;--dag-ink:#752d38}#plannerTable .cellbtn[data-dag-column=delivery]{--dag-fill:#ffe0b2;--dag-edge:#e9b16b;--dag-accent:#ee7f00;--dag-ink:#6b3900}#plannerTable .cellbtn[data-dag-column=followup]{--dag-fill:#d2ebd9;--dag-edge:#94bd9f;--dag-accent:#469766;--dag-ink:#204d30}#plannerTable .cellbtn[data-dag-column=closed]{--dag-fill:#accdb8;--dag-edge:#68977b;--dag-accent:#185b3b;--dag-ink:#123d27}#plannerTable .cellbtn[data-dag-column="not-applicable"],#plannerTable .cellbtn[data-dag-column=empty],#plannerTable .cellbtn[data-dag-column=invalid]{--dag-fill:#f0f1f2;--dag-edge:#d7dade;--dag-accent:#9aa1a6;--dag-ink:#555d63}#plannerTable .cellbtn[data-dag-column] .cellsub{opacity:1;color:inherit}#plannerTable .cellbtn[data-dag-column]:hover{filter:brightness(.97)}#plannerTable .cellbtn[data-dag-column].overdue{outline:2px dashed #8f2635;outline-offset:-2px;box-shadow:none}';
    document.head.append(style);
    function refreshCards() {
      for (const button of document.querySelectorAll('#plannerTable .cellbtn[data-id][data-b]')) {
        const activity = state.cells[button.dataset.id]?.[button.dataset.b];
        button.dataset.dagColumn = activity == null ? 'empty' : C.getActivityColumn(activity)?.id || 'invalid';
      }
    }
    function refreshMenu() {
      const current = edit ? state.cells[edit.id]?.[edit.b] : null;
      const columns = [C.columns.request, C.columns.agreement, C.columns.delivery,
        current?.status === 3 && current.followUpDone === true ? C.columns.closed : C.columns.followup,
        C.columns.notApplicable];
      for (const option of menu.options) option.textContent = columns[Number(option.value)].label;
    }
    document.getElementById('legend1').innerHTML = Object.values(C.columns).map((column, i) =>
      '<span><i class="dot" style="background:' + palette[i] +
      '"></i>' + column.label + '</span>').join('') + '<span>Deadline verstreken: gestippelde rode rand</span>';
    const priorOpen = openEdit;
    openEdit = function (id, bucket) { priorOpen(id, bucket); refreshMenu(); };
    const priorRender = renderPlanner;
    renderPlanner = function (programmes) { priorRender(programmes); refreshMenu(); refreshCards(); };
    refreshMenu();
    renderPlanner(visible());
  }
  g.DAGPlannerLabels = Object.freeze({ label, install });
})(globalThis);
