"use client";

/**
 * AppSidebar — collapsible icon rail (w-16) <-> expanded (w-60). Rendered
 * as a persistent dark "ink" surface independent of the light/dark theme
 * toggle, so the rail reads as the app's fixed identity (like a ledger
 * spine) while the content area stays on the paper-toned theme surfaces.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getNavLinksForRole } from "./nav-links";
import { BrandMark } from "./brand-mark";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppSidebar({ collapsed, onToggleCollapse }: AppSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const links = getNavLinksForRole(user.role);

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "hidden flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {/* ================= HEADER: brand ================= */}
        <div className="flex h-14 items-center justify-between px-3">
          {!collapsed ? (
            <span className="flex min-w-0 items-center gap-2.5 px-1">
              <BrandMark className="size-7" />
              <span className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</span>
            </span>
          ) : (
            <BrandMark className="mx-auto size-7" />
          )}
        </div>

        <div className="border-t border-sidebar-border" />

        {/* ================= NAV ================= */}
        <nav className="flex-1 space-y-1 p-3">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;

            const item = (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-sidebar-active-bg text-white"
                    : "text-sidebar-muted-foreground hover:bg-sidebar-active-bg/60 hover:text-sidebar-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-sidebar-accent" />
                )}
                <Icon className="size-4 shrink-0" />
                {!collapsed && link.label}
              </Link>
            );

            if (!collapsed) return item;

            return (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right">{link.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* ================= TOGGLE ================= */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className={cn(
              "text-sidebar-muted-foreground hover:bg-sidebar-active-bg/60 hover:text-sidebar-foreground",
              collapsed ? "mx-auto" : "w-full justify-start gap-2.5",
            )}
          >
            <Menu className="size-4" />
            {!collapsed && "Collapse"}
          </Button>
        </div>

        {/* ================= FOOTER: identity ================= */}
        <div className="mt-auto border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/20 text-xs font-medium text-sidebar-accent">
              {initials(user.name || user.email)}
            </div>
            {!collapsed && (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.name || "Account"}
                </span>
                <span className="truncate text-xs text-sidebar-muted-foreground">
                  {user.email}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

