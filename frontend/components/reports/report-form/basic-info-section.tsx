"use client";

import { useFormContext } from "react-hook-form";
import { useProjects } from "@/hooks/use-projects";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { ReportFormValues } from "./form-schema";

/** Given a week-start date string, returns the ISO date 6 days later (the week's end). */
function computeWeekEnd(weekStart: string): string {
  if (!weekStart) return "";
  const start = new Date(weekStart);
  if (Number.isNaN(start.getTime())) return "";
  start.setDate(start.getDate() + 6);
  return start.toISOString().slice(0, 10);
}

export function BasicInfoSection() {
  const form = useFormContext<ReportFormValues>();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const weekStart = form.watch("weekStart");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic information</CardTitle>
        <CardDescription>Which week and project this report covers.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project / category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={projectsLoading}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weekStart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Week starting</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    form.setValue("weekEnd", computeWeekEnd(e.target.value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="sm:col-span-2">
          <p className="text-sm text-muted-foreground">
            {weekStart && form.watch("weekEnd")
              ? `This report covers ${new Date(weekStart).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })} – ${new Date(form.watch("weekEnd")).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}`
              : "Select a start date. the week end is calculated automatically."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
