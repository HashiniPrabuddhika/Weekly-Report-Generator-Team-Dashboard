"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { SearchInput } from "@/components/common/search-input";
import { PageHeader } from "@/components/layout/page-header";
import { ListToolbar } from "@/components/layout/list-toolbar";
import { useTeamMembers } from "@/hooks/use-team";

export default function TeamMembersPage() {
  const router = useRouter();
  const { data: members, isLoading, isError } = useTeamMembers();
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!members) return [];
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Team members"
        description="Open a team member to see their full report history and stats."
      />

      <ListToolbar
        search={
          members && members.length > 0 ? (
            <SearchInput value={query} onChange={setQuery} placeholder="Search by name or email" />
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !members ? (
        <p className="text-sm text-muted-foreground">Couldn&apos;t load the team roster right now.</p>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No active team members yet"
          description="Invite team members from User Management to see them here."
        />
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No team members match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Total reports</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((member) => (
              <TableRow
                key={member.id}
                role="link"
                tabIndex={0}
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => router.push(`/manager/team/${member.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/manager/team/${member.id}`);
                }}
              >
                <TableCell className="font-medium text-foreground">{member.name}</TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell className="text-right tabular-nums">{member._count.reports}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
