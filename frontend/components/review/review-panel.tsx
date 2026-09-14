"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useReviewReport } from "@/hooks/use-reviews";
import { ApiError } from "@/lib/api-client";
import { ReviewAction } from "@/types/report";

export function ReviewPanel({ reportId }: { reportId: string }) {
  const router = useRouter();
  const reviewMutation = useReviewReport(reportId);
  const [changesDialogOpen, setChangesDialogOpen] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const commentTooShort = comment.trim().length > 0 && comment.trim().length < 5;

  async function handleApprove() {
    try {
      await reviewMutation.mutateAsync({ action: ReviewAction.APPROVED });
      toast.success("Report approved");
      router.push("/manager/reports");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not approve the report.");
    }
  }

  async function handleRequestChanges() {
    if (comment.trim().length < 5) return;
    try {
      await reviewMutation.mutateAsync({
        action: ReviewAction.CHANGES_REQUESTED,
        comment: comment.trim(),
      });
      toast.success("Changes requested — the team member will be notified");
      setChangesDialogOpen(false);
      router.push("/manager/reports");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not request changes.");
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-border pt-6">
      <Dialog open={changesDialogOpen} onOpenChange={setChangesDialogOpen}>
        <Button
          type="button"
          variant="outline"
          disabled={reviewMutation.isPending}
          onClick={() => setChangesDialogOpen(true)}
        >
          <XCircle className="size-4" />
          Request changes
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>
              Explain what needs to change. The team member will see this comment on their report
              and can edit and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="review-comment">Comment</Label>
            <Textarea
              id="review-comment"
              placeholder="e.g. Please add the actual deliverable link for the completed tasks."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-24"
            />
            {commentTooShort && (
              <p className="text-sm text-destructive">
                Comment must be at least 5 characters.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangesDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestChanges}
              disabled={comment.trim().length < 5 || reviewMutation.isPending}
            >
              {reviewMutation.isPending ? "Sending..." : "Send back for correction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button type="button" onClick={handleApprove} disabled={reviewMutation.isPending}>
        <CheckCircle2 className="size-4" />
        {reviewMutation.isPending ? "Approving..." : "Approve"}
      </Button>
    </div>
  );
}
