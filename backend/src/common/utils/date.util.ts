/**
 * Returns midnight UTC on the Monday of the week containing `date`.
 * Used to default dashboard queries to "the current week" when no
 * explicit `week` filter is provided.
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}
