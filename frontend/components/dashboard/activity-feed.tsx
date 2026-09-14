"use client";

import Link from "next/link";
import { CheckCircle2, History, XCircle, FileUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useActivityFeed } from "@/hooks/use-dashboard";
import type { ActivityEvent } from "@/types/dashboard";

function describeEvent(event: ActivityEvent): { icon: typeof FileUp; text: string } {
  if (event.type === "submission") {
    return {
      icon: FileUp,
      text: `${event.actorName} submitted a report (v${event.versionNumber})`,
    };
  }
  if (event.action === "APPROVED") {
    return { icon: CheckCircle2, text: `${event.actorName} approved ${event.subjectName}'s report` };
  }
  return {
    icon: XCircle,
    text: `${event.actorName} sent ${event.subjectName}'s report back for correction`,
  };
}

export function ActivityFeed() {
  const { data: events, isLoading } = useActivityFeed();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <EmptyState icon={History} title="No recent activity" />
        ) : (
          events.map((event) => {
            const { icon: Icon, text } = describeEvent(event);
            return (
              <Link
                key={`${event.reportId}-${event.timestamp}`}
                href={`/manager/reports/${event.reportId}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary/50"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-foreground">{text}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
