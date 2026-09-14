"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Search, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useTeamMembers } from "@/hooks/use-team";
import { useProjects } from "@/hooks/use-projects";
import { getNavLinksForRole } from "./nav-links";
import { Role } from "@/types/auth";

interface ResultItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Pages" | "Team Members" | "Projects";
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * A lightweight, self-contained Cmd+K search — no `cmdk` dependency, just
 * the existing Dialog + Input primitives. Searches real data (nav
 * destinations, plus team members and projects for managers/admins) rather
 * than being a decorative box that goes nowhere.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const isManagerOrAdmin = user?.role === Role.MANAGER || user?.role === Role.ADMIN;
  const { data: members } = useTeamMembers({ enabled: open && isManagerOrAdmin });
  const { data: projects } = useProjects(false, { enabled: open && isManagerOrAdmin });

  // Reset search state on close — done directly in the handler (not a
  // `useEffect` keyed on `open`) so it isn't a synchronous setState-in-effect,
  // and covers every way the dialog can close (Escape, overlay click, a result
  // being picked), not just the explicit `go()` path.
  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setActiveIndex(0);
    }
  }

  const results = React.useMemo<ResultItem[]>(() => {
    if (!user) return [];
    const q = query.trim().toLowerCase();

    const pageResults: ResultItem[] = getNavLinksForRole(user.role)
      .filter((link) => !q || link.label.toLowerCase().includes(q))
      .map((link) => ({
        id: `page:${link.href}`,
        label: link.label,
        href: link.href,
        icon: link.icon,
        group: "Pages",
      }));

    const memberResults: ResultItem[] = isManagerOrAdmin
      ? (members ?? [])
          .filter(
            (m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
          )
          .slice(0, 6)
          .map((m) => ({
            id: `member:${m.id}`,
            label: m.name,
            sublabel: m.email,
            href: `/manager/team/${m.id}`,
            icon: Users,
            group: "Team Members" as const,
          }))
      : [];

    const projectResults: ResultItem[] = isManagerOrAdmin
      ? (projects ?? [])
          .filter((p) => !q || p.name.toLowerCase().includes(q))
          .slice(0, 6)
          .map((p) => ({
            id: `project:${p.id}`,
            label: p.name,
            sublabel: p.isActive ? "Active" : "Inactive",
            href: `/manager/projects`,
            icon: FolderKanban,
            group: "Projects" as const,
          }))
      : [];

    // Without a query, keep it to page navigation only — team/project
    // lists are for narrowing down to a specific one, not browsing.
    if (!q) return pageResults;
    return [...pageResults, ...memberResults, ...projectResults];
  }, [query, user, isManagerOrAdmin, members, projects]);

  function go(href: string) {
    router.push(href);
    handleOpenChange(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) go(target.href);
    }
  }

  let groupCursor: ResultItem["group"] | null = null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-24 max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, team members, projects…"
            className="h-12 border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map((item, index) => {
              const showGroupLabel = item.group !== groupCursor;
              groupCursor = item.group;
              const Icon = item.icon;

              return (
                <React.Fragment key={item.id}>
                  {showGroupLabel && (
                    <p className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                      {item.group}
                    </p>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(item.href)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm",
                      index === activeIndex
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-secondary/60",
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="shrink-0 truncate text-xs text-muted-foreground">
                        {item.sublabel}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5">Enter</kbd>
            Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5">Esc</kbd>
            Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
