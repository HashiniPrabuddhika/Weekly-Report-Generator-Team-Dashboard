"use client";

import * as React from "react";
import { toast } from "sonner";
import { FolderKanban, Pencil, Plus, Power, PowerOff, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ListToolbar } from "@/components/layout/list-toolbar";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ManageMembersDialog } from "@/components/projects/manage-members-dialog";
import { SearchInput } from "@/components/common/search-input";
import {
  useProjects,
  useDeactivateProject,
  useReactivateProject,
} from "@/hooks/use-projects";
import { ApiError } from "@/lib/api-client";
import type { Project } from "@/types/report";

export default function ProjectsManagementPage() {
  const { data: projects, isLoading, isError } = useProjects(/* includeInactive */ true);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | undefined>(undefined);
  const [toggleTarget, setToggleTarget] = React.useState<Project | undefined>(undefined);
  const [membersOpen, setMembersOpen] = React.useState(false);
  const [membersProject, setMembersProject] = React.useState<Project | undefined>(undefined);
  const [query, setQuery] = React.useState("");

  const filteredProjects = React.useMemo(() => {
    if (!projects) return [];
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q),
    );
  }, [projects, query]);

  const deactivateMutation = useDeactivateProject();
  const reactivateMutation = useReactivateProject();
  const isToggling = deactivateMutation.isPending || reactivateMutation.isPending;

  function openCreateDialog() {
    setEditingProject(undefined);
    setFormOpen(true);
  }

  function openEditDialog(project: Project) {
    setEditingProject(project);
    setFormOpen(true);
  }

  function openMembersDialog(project: Project) {
    setMembersProject(project);
    setMembersOpen(true);
  }

  function handleConfirmToggle() {
    if (!toggleTarget) return;
    const mutation = toggleTarget.isActive ? deactivateMutation : reactivateMutation;

    mutation.mutate(toggleTarget.id, {
      onSuccess: () => {
        toast.success(toggleTarget.isActive ? "Project deactivated" : "Project reactivated");
        setToggleTarget(undefined);
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : "Something went wrong");
      },
    });
  }

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Projects"
        description="Projects and categories team members can attach to their weekly reports."
      />

      <ListToolbar
        search={
          projects && projects.length > 0 ? (
            <SearchInput value={query} onChange={setQuery} placeholder="Search projects" />
          ) : undefined
        }
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="size-4" />
            Add project
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !projects ? (
        <p className="text-sm text-muted-foreground">Couldn&apos;t load projects right now.</p>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Add one so team members have something to attach their reports to."
        />
      ) : filteredProjects.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No projects match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium text-foreground">{project.name}</TableCell>
                <TableCell className="max-w-sm truncate text-muted-foreground">
                  {project.description || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={project.isActive ? "approved" : "draft"}>
                    {project.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openMembersDialog(project)}>
                      <Users className="size-4" />
                      Members
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)}>
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToggleTarget(project)}
                    >
                      {project.isActive ? (
                        <>
                          <PowerOff className="size-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="size-4" />
                          Reactivate
                        </>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={editingProject} />

      <ManageMembersDialog open={membersOpen} onOpenChange={setMembersOpen} project={membersProject} />

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(undefined)}
        title={toggleTarget?.isActive ? "Deactivate project?" : "Reactivate project?"}
        description={
          toggleTarget?.isActive
            ? `"${toggleTarget?.name}" will no longer appear as an option on new reports. Existing reports that already reference it are unaffected.`
            : `"${toggleTarget?.name}" will become selectable on new reports again.`
        }
        confirmLabel={toggleTarget?.isActive ? "Deactivate" : "Reactivate"}
        variant={toggleTarget?.isActive ? "destructive" : "default"}
        onConfirm={handleConfirmToggle}
        isPending={isToggling}
      />
    </div>
  );
}
