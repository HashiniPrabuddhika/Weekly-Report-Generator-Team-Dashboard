"use client";

import { useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { TaskPriority, TaskStatus } from "@/types/report";
import type { ReportFormValues } from "./form-schema";

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};

export function TaskRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const form = useFormContext<ReportFormValues>();

  return (
    <TableRow>
      <TableCell className="min-w-48 whitespace-normal">
        <FormField
          control={form.control}
          name={`tasks.${index}.taskName`}
          render={({ field }) => (
            <FormItem className="gap-1">
              <FormControl>
                <Input placeholder="e.g. Implement login page" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`tasks.${index}.priority`}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-32">
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
      </TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`tasks.${index}.plannedPercentage`}
          render={({ field }) => (
            <Input
              type="number"
              min={0}
              max={100}
              className="w-20 tabular-nums"
              value={field.value}
              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
            />
          )}
        />
      </TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`tasks.${index}.actualPercentage`}
          render={({ field }) => (
            <Input
              type="number"
              min={0}
              max={100}
              className="w-20 tabular-nums"
              value={field.value}
              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
            />
          )}
        />
      </TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`tasks.${index}.status`}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TaskStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`tasks.${index}.plannedHours`}
          render={({ field }) => (
            <Input
              type="number"
              min={0}
              className="w-20 tabular-nums"
              value={field.value}
              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
            />
          )}
        />
      </TableCell>

      <TableCell>
        <FormField
          control={form.control}
          name={`tasks.${index}.actualHours`}
          render={({ field }) => (
            <Input
              type="number"
              min={0}
              className="w-20 tabular-nums"
              value={field.value}
              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
            />
          )}
        />
      </TableCell>

      <TableCell className="min-w-40">
        <FormField
          control={form.control}
          name={`tasks.${index}.deliverable`}
          render={({ field }) => (
            <Input placeholder="Link or note" {...field} value={field.value ?? ""} />
          )}
        />
      </TableCell>

      <TableCell>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove task">
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
