/* Shared activity grouping and move planning. No storage or UI side effects. */
(function (root) {
  'use strict';
  const C = typeof module === 'object' && module.exports
    ? require('./status-columns.js') : root.DAGStatusColumns;
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const columnList = Object.freeze(Object.values(C.columns));

  // Each container refers to the original programme and activity objects.
  // Missing, invalid, deleted-bucket and orphan records never create containers.
  function groupActivities(state, options = {}) {
    const lanes = columnList.map(column => ({ column, containers: [], activities: 0 }));
    const validState = object(state) && Array.isArray(state.programs) &&
      Array.isArray(state.buckets) && object(state.cells);
    if (!validState) return { lanes, programmes: 0, activities: 0, notApplicable: 0, invalid: 0 };
    const selected = options.programmeIds == null ? null : new Set(options.programmeIds);
    const ids = new Set();
    let activities = 0, notApplicable = 0, invalid = 0;
    const seenProgrammes = new Set();
    for (const programme of state.programs) {
      if (!object(programme) || seenProgrammes.has(programme.id)) continue;
      seenProgrammes.add(programme.id);
      if (selected && !selected.has(programme.id)) continue;
      const cells = own(state.cells, programme.id) ? state.cells[programme.id] : null;
      if (!object(cells)) continue;
      const containers = new Map(), seenBuckets = new Set();
      for (const bucket of state.buckets) {
        if (!object(bucket) || seenBuckets.has(bucket.id)) continue;
        seenBuckets.add(bucket.id);
        if (!own(cells, bucket.id)) continue;
        const activity = cells[bucket.id], column = C.getActivityColumn(activity);
        if (!column) { invalid++; continue; }
        const na = column.id === 'not-applicable';
        if (na) { notApplicable++; if (!options.includeNotApplicable) continue; }
        else { activities++; ids.add(programme.id); }
        if (!containers.has(column.id)) containers.set(column.id, { programme, items: [] });
        containers.get(column.id).items.push({ bucket, activity });
      }
      for (const [id, container] of containers) {
        const lane = lanes.find(lane => lane.column.id === id);
        lane.containers.push(container);
        lane.activities += container.items.length;
      }
    }
    return { lanes, programmes: ids.size, activities, notApplicable, invalid };
  }

  // The caller must authenticate, check for conflicts, apply next to this cell
  // and use the existing shared save pipeline. Planning itself changes nothing.
  function planActivityMove(state, programmeId, bucketId, targetId, date, timestamp) {
    if (!object(state) || !Array.isArray(state.programs) || !Array.isArray(state.buckets) ||
        !object(state.cells) || !state.programs.some(p => p.id === programmeId) ||
        !state.buckets.some(b => b.id === bucketId) || !own(state.cells, programmeId)) return null;
    const cells = state.cells[programmeId];
    if (!object(cells) || !own(cells, bucketId)) return null;
    const previous = cells[bucketId], column = C.getActivityColumn(previous);
    const target = columnList.find(c => c.id === targetId);
    if (!column || !target) return null;
    if (column.id === targetId) return { changed: false, previous, next: previous };
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date ||
        typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp))) return null;
    const status = { request: 0, agreement: 1, delivery: 2, followup: 3,
      closed: 3, 'not-applicable': 4 }[targetId];
    const next = { ...previous, status, updated: timestamp,
      done: status === 3 ? (previous.done || date) : '' };
    // Reopening or delivering again must never reuse a stale closed marker.
    next.followUpDone = targetId === 'closed';
    if (own(next, 'productStepIndex')) delete next.productStepIndex;
    return { changed: true, previous, next };
  }

  const api = Object.freeze({ columnList, groupActivities, planActivityMove });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DAGStatusContainers = api;
})(globalThis);
