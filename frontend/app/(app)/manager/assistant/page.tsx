"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { WeekPicker } from "@/components/dashboard/week-picker";
import { TeamSummaryCard } from "@/components/ai/team-summary-card";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";

export default function AiAssistantPage() {
  const [week, setWeek] = React.useState<string | undefined>(undefined);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="AI Assistant"
        description="Ask questions or generate a summary — both are grounded in the same structured report data as the dashboard, never raw text sent verbatim."
        action={<WeekPicker value={week} onChange={setWeek} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TeamSummaryCard week={week} />
        <AiChatPanel week={week} />
      </div>
    </div>
  );
}
