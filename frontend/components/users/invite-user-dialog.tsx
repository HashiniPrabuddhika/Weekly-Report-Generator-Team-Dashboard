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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { useCreateUser } from "@/hooks/use-users";
import { Role } from "@/types/auth";

const ROLE_LABELS: Record<Role, string> = {
  TEAM_MEMBER: "Team Member",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Remount fresh each time the dialog opens, discarding any previous input. */}
        <InviteUserForm key={open ? "open" : "closed"} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function InviteUserForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>(Role.TEAM_MEMBER);

  const createMutation = useCreateUser();
  const isValid = name.trim().length >= 2 && email.includes("@") && password.length >= 8;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    createMutation.mutate(
      { name: name.trim(), email: email.trim(), password, role },
      {
        onSuccess: () => {
          toast.success(`Account created for ${name.trim()}`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : "Something went wrong");
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add team member</DialogTitle>
        <DialogDescription>
          Create an account directly and share the password with them — there&apos;s no email
          invite flow yet, so set a temporary password they can change later.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="user-name">Full name</Label>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hashini Perera"
            required
            disabled={createMutation.isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-email">Email</Label>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hashini@company.com"
            required
            disabled={createMutation.isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-password">Temporary password</Label>
          <Input
            id="user-password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            disabled={createMutation.isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-full">
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
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create account"}
        </Button>
      </DialogFooter>
    </form>
  );
}
