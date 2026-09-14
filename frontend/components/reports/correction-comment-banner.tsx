import { MessageSquareWarning } from "lucide-react";

export function CorrectionCommentBanner({ comment }: { comment: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-status-needs-correction/30 bg-status-needs-correction-bg p-4">
      <MessageSquareWarning className="mt-0.5 size-5 shrink-0 text-status-needs-correction" />
      <div>
        <p className="text-sm font-medium text-status-needs-correction">
          Your manager requested changes
        </p>
        <p className="mt-1 text-sm text-foreground">{comment}</p>
      </div>
    </div>
  );
}
