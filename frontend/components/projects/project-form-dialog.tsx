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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";
import { useCreateProject, useUpdateProject } from "@/hooks/use-projects";
import type { Project } from "@/types/report";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present → editing this project. Absent → creating a new one. */
  project?: Project;
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Keying on the dialog's open state + project id remounts the form
            fresh each time it's opened (for a new project, or a different
            one), instead of syncing stale state back in with an effect. */}
        <ProjectForm key={open ? (project?.id ?? "new") : "closed"} project={project} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({
  project,
  onOpenChange,
}: {
  project?: Project;
  onOpenChange: (open: boolean) => void;
}) {
  const isEditing = !!project;
  const [name, setName] = React.useState(project?.name ?? "");
  const [description, setDescription] = React.useState(project?.description ?? "");

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject(project?.id ?? "");
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name: name.trim(), description: description.trim() || undefined };

    const mutation = isEditing ? updateMutation : createMutation;
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEditing ? "Project updated" : "Project created");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : "Something went wrong");
      },
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit project" : "Add project"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update this project's name or description."
            : "Team members will be able to select this project on their weekly reports."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="project-name">Name</Label>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Client A"
            required
            minLength={2}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project-description">Description (optional)</Label>
          <Textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this project covers"
            rows={3}
            disabled={isPending}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || name.trim().length < 2}>
          {isEditing ? "Save changes" : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  );
}
