"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

interface Crumb {
  label: string;
  path: string;
}

// Static labels for known segments. Dynamic segments (report/user ids)
// fall back to a generic label — a global breadcrumb has no cheap way to
// know a specific report's week or a member's name without an extra
// fetch, and the page itself already shows that detail prominently.
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  reports: "Reports",
  new: "New Report",
  edit: "Edit",
  versions: "Version History",
  manager: "Manager",
  team: "Team",
  projects: "Projects",
  users: "User Management",
};

function isLikelyId(segment: string): boolean {
  // uuid-ish or otherwise not a known static label
  return !SEGMENT_LABELS[segment] && segment.length > 8;
}

function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let path = "";

  for (const segment of segments) {
    path += `/${segment}`;
    if (isLikelyId(segment)) {
      crumbs.push({ label: "Details", path });
    } else {
      crumbs.push({ label: SEGMENT_LABELS[segment] ?? segment, path });
    }
  }

  return crumbs;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  if (crumbs.length === 0) return null;

  return (
    <ol className="flex min-w-0 items-center gap-1.5 text-sm">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <li key={crumb.path} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
            )}
            {isLast ? (
              <span className="truncate font-medium text-foreground">{crumb.label}</span>
            ) : (
              <button
                type="button"
                onClick={() => router.push(crumb.path)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
