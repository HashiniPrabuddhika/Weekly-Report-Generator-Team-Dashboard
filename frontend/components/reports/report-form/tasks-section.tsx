"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import { TaskRow } from "./task-row";
import { EMPTY_TASK, type ReportFormValues } from "./form-schema";

export function TasksSection() {
  const form = useFormContext<ReportFormValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "tasks" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks completed</CardTitle>
        <CardDescription>What you worked on this week, with planned vs. actual progress.</CardDescription>
      </CardHeader>
      <CardContent>
        {fields.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Planned %</TableHead>
                <TableHead>Actual %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Planned hrs</TableHead>
                <TableHead>Actual hrs</TableHead>
                <TableHead>Deliverable</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TaskRow key={field.id} index={index} onRemove={() => remove(index)} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No tasks added yet. Add the tasks you completed this week.
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => append(EMPTY_TASK)}
        >
          <Plus className="size-4" />
          Add task
        </Button>
      </CardContent>
    </Card>
  );
}
