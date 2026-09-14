import { RouteGuard } from "@/components/auth/route-guard";
import { Role } from "@/types/auth";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={[Role.MANAGER, Role.ADMIN]}>{children}</RouteGuard>;
}
