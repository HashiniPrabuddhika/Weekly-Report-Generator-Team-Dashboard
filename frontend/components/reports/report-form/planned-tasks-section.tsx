"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { TaskPriority } from "@/types/report";
import { EMPTY_PLANNED_TASK, type ReportFormValues } from "./form-schema";

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export function PlannedTasksSection() {
  const form = useFormContext<ReportFormValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "plannedTasks" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planned for next week</CardTitle>
        <CardDescription>What you intend to work on next.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No planned tasks added yet.</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2 rounded-md border border-border p-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_140px]">
              <FormField
                control={form.control}
                name={`plannedTasks.${index}.taskName`}
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormControl>
                      <Input placeholder="Task name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`plannedTasks.${index}.priority`}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskPriority).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                control={form.control}
                name={`plannedTasks.${index}.description`}
                render={({ field }) => (
                  <FormItem className="gap-1 sm:col-span-2">
                    <FormControl>
                      <Input
                        placeholder="Optional note"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label="Remove planned task"
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(EMPTY_PLANNED_TASK)}
        >
          <Plus className="size-4" />
          Add planned task
        </Button>
      </CardContent>
    </Card>
  );
}
