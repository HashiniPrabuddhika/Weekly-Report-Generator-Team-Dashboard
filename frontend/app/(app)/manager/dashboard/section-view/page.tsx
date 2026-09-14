"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { WeekPicker } from "@/components/dashboard/week-picker";
import { SectionPicker } from "@/components/dashboard/section-picker";
import { SectionViewBoard } from "@/components/dashboard/section-view-board";
import { useSectionView } from "@/hooks/use-dashboard";
import { ReportSection, SECTION_LABELS } from "@/types/dashboard";

export default function SectionViewPage() {
  const [week, setWeek] = React.useState<string | undefined>(undefined);
  const [section, setSection] = React.useState<ReportSection>(ReportSection.BLOCKERS);

  const { data, isLoading, isFetching } = useSectionView(week, section);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="Cross team section view"
        description={
          data
            ? `${SECTION_LABELS[data.section]}  week of ${new Date(data.week).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", year: "numeric" },
              )}`
            : "Compare one section of every team member's report without opening each one individually."
        }
      />

      <div className="flex flex-wrap items-end gap-4">
        <WeekPicker value={week} onChange={setWeek} />
        <SectionPicker value={section} onChange={setSection} />
        {isFetching && !isLoading && (
          <span className="pb-2 text-xs text-muted-foreground">Refreshing…</span>
        )}
      </div>

      <SectionViewBoard data={data} isLoading={isLoading} />
    </div>
  );
}
