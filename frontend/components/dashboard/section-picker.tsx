"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportSection, SECTION_LABELS } from "@/types/dashboard";

interface SectionPickerProps {
  value: ReportSection | undefined;
  onChange: (section: ReportSection) => void;
}

const SECTION_ORDER: ReportSection[] = [
  ReportSection.BLOCKERS,
  ReportSection.ACHIEVEMENTS,
  ReportSection.TASKS_COMPLETED,
  ReportSection.PLANNED_TASKS,
  ReportSection.NOTES,
];

export function SectionPicker({ value, onChange }: SectionPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="section-picker" className="text-xs font-medium text-muted-foreground">
        Section
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as ReportSection)}>
        <SelectTrigger id="section-picker" className="w-56">
          <SelectValue placeholder="Choose a section…" />
        </SelectTrigger>
        <SelectContent>
          {SECTION_ORDER.map((section) => (
            <SelectItem key={section} value={section}>
              {SECTION_LABELS[section]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
