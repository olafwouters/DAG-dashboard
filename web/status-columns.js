/* Shared, read-only translation from a stored Planner activity to a Status column. */
(function (root) {
  'use strict';

  const columns = Object.freeze({
    request: Object.freeze({ id: 'request', label: 'Hulpvraag' }),
    agreement: Object.freeze({ id: 'agreement', label: 'Afstemming' }),
    delivery: Object.freeze({ id: 'delivery', label: 'Uitvoering' }),
    followup: Object.freeze({ id: 'followup', label: 'Follow-up' }),
    closed: Object.freeze({ id: 'closed', label: 'Afgesloten' }),
    notApplicable: Object.freeze({ id: 'not-applicable', label: 'Niet van toepassing' })
  });
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  /**
   * Pass the stored activity, e.g. state.cells[programmeId]?.[bucketId].
   * Do not pass a generated blank/default record for a missing activity.
   * Returns a frozen { id, label } column, or null for missing/invalid input.
   * followUpDone is a boolean: true means explicitly finished follow-up.
   * For status 3, absent/undefined/null/false means follow-up is still open.
   * Other follow-up values are invalid for status 3; no truthy coercion.
   * For statuses other than 3 the marker is irrelevant and ignored.
   * This function never changes the activity or any application state.
   */
  function getActivityColumn(activity) {
    if (activity === null || typeof activity !== 'object' || Array.isArray(activity)) return null;
    if (!hasOwn(activity, 'status')) return null;
    const status = activity.status;
    if (!Number.isInteger(status) || status < 0 || status > 4) return null;
    if (status === 0) return columns.request;
    if (status === 1) return columns.agreement;
    if (status === 2) return columns.delivery;
    if (status === 4) return columns.notApplicable;

    const followUpDone = hasOwn(activity, 'followUpDone') ? activity.followUpDone : undefined;
    if (followUpDone != null && typeof followUpDone !== 'boolean') return null;
    return followUpDone === true ? columns.closed : columns.followup;
  }

  const api = Object.freeze({ columns, getActivityColumn });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DAGStatusColumns = api;
})(globalThis);
