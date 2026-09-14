// app/(app)/layout.tsx
"use client";

import * as React from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppTopbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}