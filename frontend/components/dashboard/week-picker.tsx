"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getMondayOfWeek } from "@/lib/date-utils";

interface WeekPickerProps {
  value: string | undefined;
  onChange: (week: string | undefined) => void;
}

export function WeekPicker({ value, onChange }: WeekPickerProps) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dashboard-week" className="text-xs font-medium text-muted-foreground">
          Week
        </label>
        <Input
          id="dashboard-week"
          type="date"
          className="w-40"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? getMondayOfWeek(e.target.value) : undefined)}
        />
      </div>
      {value && (
        <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
          Reset to current week
        </Button>
      )}
    </div>
  );
}
