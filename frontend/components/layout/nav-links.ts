import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  FolderKanban,
  Users,
  ClipboardCheck,
  UserCog,
  Columns3,
  Bot,
} from "lucide-react";
import { Role } from "@/types/auth";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const memberNavLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "My Reports", icon: FileText },
  { href: "/reports/new", label: "New Report", icon: FilePlus },
];

export const managerNavLinks: NavLink[] = [
  { href: "/manager/dashboard", label: "Team Dashboard", icon: LayoutDashboard },
  { href: "/manager/dashboard/section-view", label: "Cross Team View", icon: Columns3 },
  { href: "/manager/assistant", label: "AI Assistant", icon: Bot },
  { href: "/manager/reports", label: "Team Reports", icon: ClipboardCheck },
  { href: "/manager/team", label: "Team Members", icon: Users },
  { href: "/manager/projects", label: "Projects", icon: FolderKanban },
];

export const adminNavLinks: NavLink[] = [
  { href: "/manager/users", label: "User Management", icon: UserCog },
];

export function getNavLinksForRole(role: Role): NavLink[] {
  if (role === Role.ADMIN) {
    return [...managerNavLinks, ...adminNavLinks];
  }
  if (role === Role.MANAGER) {
    return managerNavLinks;
  }
  return memberNavLinks;
}
