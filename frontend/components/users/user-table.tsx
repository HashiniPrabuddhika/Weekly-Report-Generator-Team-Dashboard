"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useUpdateUserRole, useUpdateUserStatus } from "@/hooks/use-users";
import { ApiError } from "@/lib/api-client";
import { Role } from "@/types/auth";
import type { ManagedUser } from "@/types/user";

const ROLE_LABELS: Record<Role, string> = {
  TEAM_MEMBER: "Team Member",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

function UserRow({ user }: { user: ManagedUser }) {
  const updateRole = useUpdateUserRole(user.id);
  const updateStatus = useUpdateUserStatus(user.id);
  const [pendingDeactivate, setPendingDeactivate] = React.useState(false);

  function handleRoleChange(role: Role) {
    updateRole.mutate(role, {
      onSuccess: () => toast.success(`${user.name}'s role updated to ${ROLE_LABELS[role]}`),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "Could not update role"),
    });
  }

  function handleToggleActive(nextValue: boolean) {
    // Turning OFF (deactivating) needs confirmation; turning back on doesn't.
    if (!nextValue) {
      setPendingDeactivate(true);
      return;
    }
    updateStatus.mutate(true, {
      onSuccess: () => toast.success(`${user.name} reactivated`),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "Could not update status"),
    });
  }

  function confirmDeactivate() {
    updateStatus.mutate(false, {
      onSuccess: () => {
        toast.success(`${user.name} deactivated`);
        setPendingDeactivate(false);
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : "Could not update status");
        setPendingDeactivate(false);
      },
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">{user.name}</TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        <Select
          value={user.role}
          onValueChange={(v) => handleRoleChange(v as Role)}
          disabled={updateRole.isPending}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Role).map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Badge variant={user.isActive ? "approved" : "draft"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Switch
            checked={user.isActive}
            onCheckedChange={handleToggleActive}
            disabled={updateStatus.isPending}
          />
        </div>
      </TableCell>

      <ConfirmDialog
        open={pendingDeactivate}
        onOpenChange={setPendingDeactivate}
        title="Deactivate this account?"
        description={`${user.name} will no longer be able to log in. Their existing reports are kept.`}
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={confirmDeactivate}
        isPending={updateStatus.isPending}
      />
    </TableRow>
  );
}

export function UserTable({ users }: { users: ManagedUser[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </TableBody>
    </Table>
  );
}
