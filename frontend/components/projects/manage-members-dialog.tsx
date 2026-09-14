"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import { useProjectMembers, useSetProjectMembers } from "@/hooks/use-projects";
import { useTeamMembers } from "@/hooks/use-team";
import type { Project } from "@/types/report";
import type { TeamMemberSummary } from "@/types/manager";

interface ManageMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | undefined;
}

export function ManageMembersDialog({ open, onOpenChange, project }: ManageMembersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Remounts fresh per project (and on every reopen), same reasoning
            as ProjectFormDialog — selection state must never leak between
            projects or survive a cancelled dialog. */}
        {project && (
          <ManageMembersForm
            key={open ? project.id : "closed"}
            project={project}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DialogChrome({
  project,
  onOpenChange,
  children,
  saveDisabled,
  onSave,
}: {
  project: Project;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  saveDisabled: boolean;
  onSave?: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Manage members — {project.name}</DialogTitle>
        <DialogDescription>
          Choose which team members are assigned to this project. This doesn&apos;t restrict who
          can select it on a report — it&apos;s for tracking who&apos;s actively working on it.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-80 space-y-1 overflow-y-auto py-4">{children}</div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saveDisabled}>
          Save members
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Loading gate. Split out so the editor below only ever mounts once both
 * queries have resolved — meaning its `useState` can seed synchronously
 * from real data via a lazy initializer, with no effect required to sync
 * server data into local state after the fact.
 */
function ManageMembersForm({
  project,
  onOpenChange,
}: {
  project: Project;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers();
  const { data: currentMembers, isLoading: membersLoading } = useProjectMembers(project.id);

  if (teamLoading || membersLoading || !teamMembers || !currentMembers) {
    return (
      <DialogChrome project={project} onOpenChange={onOpenChange} saveDisabled>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </DialogChrome>
    );
  }

  return (
    <ManageMembersEditor
      project={project}
      onOpenChange={onOpenChange}
      teamMembers={teamMembers}
      initialMemberIds={currentMembers.map((m) => m.id)}
    />
  );
}

function ManageMembersEditor({
  project,
  onOpenChange,
  teamMembers,
  initialMemberIds,
}: {
  project: Project;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMemberSummary[];
  initialMemberIds: string[];
}) {
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set(initialMemberIds));
  const setMembersMutation = useSetProjectMembers(project.id);

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function handleSave() {
    setMembersMutation.mutate([...selected], {
      onSuccess: () => {
        toast.success(`Members updated for "${project.name}"`);
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : "Something went wrong");
      },
    });
  }

  return (
    <DialogChrome
      project={project}
      onOpenChange={onOpenChange}
      saveDisabled={setMembersMutation.isPending}
      onSave={handleSave}
    >
      {teamMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active team members yet — add some from User Management first.
        </p>
      ) : (
        teamMembers.map((member) => (
          <label
            key={member.id}
            htmlFor={`member-${member.id}`}
            className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent"
          >
            <Checkbox
              id={`member-${member.id}`}
              checked={selected.has(member.id)}
              onCheckedChange={() => toggle(member.id)}
            />
            <span className="flex-1 truncate">
              <span className="text-sm font-medium text-foreground">{member.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{member.email}</span>
            </span>
          </label>
        ))
      )}
    </DialogChrome>
  );
}
