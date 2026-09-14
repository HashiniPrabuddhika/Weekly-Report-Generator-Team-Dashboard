"use client";

import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationsBell() {
  const { items, isLoading } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-[1.1rem]" />
          {items.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-destructive" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
          {items.length > 0 && (
            <span className="text-[10px] font-medium uppercase text-muted-foreground">
              {items.length} pending
            </span>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <CheckCircle2 className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nothing needs your attention.</p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.id} className="border-b border-border last:border-0">
                  <Link
                    href={item.href}
                    className="block px-4 py-3 transition-colors hover:bg-secondary/50"
                  >
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
