"use client";

import * as React from "react";
import { UserPlus, Users as UsersIcon } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { UserTable } from "@/components/users/user-table";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { PageHeader } from "@/components/layout/page-header";
import { ListToolbar } from "@/components/layout/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersManagementPage() {
  const { data: users, isLoading, isError } = useUsers();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="User management"
        description="Add team members, change roles, and deactivate accounts."
      />

      <ListToolbar
        search={
          users && users.length > 0 ? (
            <SearchInput value={query} onChange={setQuery} placeholder="Search by name or email" />
          ) : undefined
        }
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            Add team member
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError || !users ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Couldn&apos;t load users right now.
            </p>
          ) : users.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={UsersIcon} title="No users yet" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No users match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <UserTable users={filteredUsers} />
          )}
        </CardContent>
      </Card>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
