"use client";

import * as React from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import { useGenerateTeamSummary } from "@/hooks/use-ai";

interface TeamSummaryCardProps {
  week: string | undefined;
}

export function TeamSummaryCard({ week }: TeamSummaryCardProps) {
  const mutation = useGenerateTeamSummary();

  // Regenerate whenever the selected week changes, rather than showing a
  // stale summary for a week the manager has already navigated away from.
  React.useEffect(() => {
    mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week]);

  const isUnconfigured =
    mutation.isError && mutation.error instanceof ApiError && mutation.error.status === 503;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              AI team summary
            </CardTitle>
            <CardDescription>
              A one click digest of this week&apos;s progress, blockers, and anything that needs
              attention generated from the same data as the dashboard, never raw report text.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => mutation.mutate(week)} disabled={mutation.isPending}>
            {mutation.isPending ? "Generating…" : mutation.data ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mutation.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : isUnconfigured ? (
          <div className="flex items-start gap-2.5 rounded-md border border-dashed border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              The AI assistant isn&apos;t configured on this server yet. Set{" "}
              <code className="rounded bg-secondary px-1 py-0.5 text-xs">OPENROUTER_API_KEY</code>{" "}
              in the backend environment to enable it.
            </span>
          </div>
        ) : mutation.isError ? (
          <p className="text-sm text-destructive">
            Couldn&apos;t generate a summary right now. Try again in a moment.
          </p>
        ) : mutation.data ? (
          <div className="space-y-3">
            <p className="whitespace-pre-wrap text-sm text-foreground">{mutation.data.summary}</p>
            <p className="border-t border-border pt-2 text-xs text-muted-foreground">
              Based on {mutation.data.basedOn.submittedCount} of{" "}
              {mutation.data.basedOn.totalTeamMembers} reports submitted for the week of{" "}
              {new Date(mutation.data.basedOn.week).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
              .
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click &quot;Generate&quot; for a manager-ready summary of this week&apos;s team
            activity.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
