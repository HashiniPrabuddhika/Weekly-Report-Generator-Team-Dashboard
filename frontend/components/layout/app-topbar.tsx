"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getNavLinksForRole } from "./nav-links";
import { Breadcrumbs } from "./breadcrumbs";
import { NotificationsBell } from "./notifications-bell";
import { CommandPalette } from "./command-palette";
import { BrandLockup } from "./brand-mark";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import * as React from "react";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppTopbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Cmd+K / Ctrl+K opens the search palette from anywhere in the app.
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!user) return null;

  const links = getNavLinksForRole(user.role);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Mobile nav — the collapsible rail is desktop-only (md:flex), so
            small screens get an overlay sheet instead. */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground">
            <SheetHeader>
              <SheetTitle className="text-sidebar-foreground">
                <BrandLockup textClassName="text-sidebar-foreground" />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-0.5 px-3">
              {links.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-sidebar-active-bg text-white"
                        : "text-sidebar-muted-foreground hover:bg-sidebar-active-bg/60",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="hidden min-w-0 md:block">
          <Breadcrumbs />
        </div>
        <span className="md:hidden">
          <BrandLockup textClassName="text-foreground" />
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setSearchOpen(true)}
          className="hidden w-64 justify-between text-muted-foreground font-normal sm:flex"
        >
          <span className="flex items-center gap-2">
            <Search className="size-4" />
            Search…
          </span>
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(true)}
          className="sm:hidden"
          aria-label="Search"
        >
          <Search className="size-5" />
        </Button>

        <NotificationsBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/60">
              <Avatar className="size-7">
                <AvatarFallback>{initials(user.name || user.email)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block font-medium text-foreground">{user.name || user.email}</span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium text-foreground">{user.name || "Account"}</div>
              <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
