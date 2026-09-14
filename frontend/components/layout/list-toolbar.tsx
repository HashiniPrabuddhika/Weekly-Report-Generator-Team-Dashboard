import type { ReactNode } from "react";

interface ListToolbarProps {
  /** Left side — typically a SearchInput. */
  search?: ReactNode;
  /** Right side — typically a primary action button. */
  actions?: ReactNode;
}

/**
 * The toolbar row that sits between a page's header and its table: search
 * on the left, primary actions on the right, always on one line down to
 * small-tablet widths (wrapping only as a last resort on very narrow
 * screens). Kept separate from PageHeader on purpose — cramming a search
 * box into the same row as the page title is what caused it to wrap onto
 * an awkward second line under real-world viewport widths.
 */
export function ListToolbar({ search, actions }: ListToolbarProps) {
  if (!search && !actions) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">{search}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
