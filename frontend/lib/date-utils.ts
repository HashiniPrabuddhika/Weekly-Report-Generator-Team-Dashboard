/**
 * Returns the ISO date (YYYY-MM-DD) of the Monday of the week containing
 * `date`. Mirrors backend/src/common/utils/date.util.ts's getStartOfWeek()
 * exactly — the manager reports/dashboard endpoints filter by an exact
 * `weekStart` match, so the frontend must snap to the same Monday the
 * backend would compute, not just forward whatever date was picked.
 */
export function getMondayOfWeek(date: Date | string = new Date()): string {
  const input = typeof date === "string" ? new Date(date) : date;
  const d = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
