import { RouteGuard } from "@/components/auth/route-guard";
import { Role } from "@/types/auth";

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={[Role.ADMIN]}>{children}</RouteGuard>;
}
