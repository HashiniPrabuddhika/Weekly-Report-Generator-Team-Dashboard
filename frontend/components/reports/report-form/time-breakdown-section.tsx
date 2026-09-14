"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/ui/form";
import { TimeTaskType } from "@/types/report";
import { EMPTY_TIME_ENTRY, type ReportFormValues } from "./form-schema";

const TASK_TYPE_LABELS: Record<string, string> = {
  DEVELOPMENT: "Development",
  TESTING: "Testing",
  MEETINGS: "Meetings",
  DOCUMENTATION: "Documentation",
  OTHER: "Other",
};

export function TimeBreakdownSection() {
  const form = useFormContext<ReportFormValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "timeEntries" });

  const total = (form.watch("timeEntries") ?? []).reduce(
    (sum, entry) => sum + (Number(entry?.hours) || 0),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hours by task type</CardTitle>
        <CardDescription>Optional — how your time broke down this week.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No time breakdown added.</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name={`timeEntries.${index}.taskType`}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TimeTaskType).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TASK_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormField
              control={form.control}
              name={`timeEntries.${index}.hours`}
              render={({ field }) => (
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  className="w-24 tabular-nums"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              )}
            />
            <span className="text-sm text-muted-foreground">hrs</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label="Remove time entry"
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ))}

        {fields.length > 0 && (
          <p className="text-sm font-medium text-foreground tabular-nums">
            Total: {total} {total === 1 ? "hour" : "hours"}
          </p>
        )}

        <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_TIME_ENTRY)}>
          <Plus className="size-4" />
          Add time entry
        </Button>
      </CardContent>
    </Card>
  );
}
