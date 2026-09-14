"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { EMPTY_BLOCKER, type ReportFormValues } from "./form-schema";

export function BlockersSection() {
  const form = useFormContext<ReportFormValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "blockers" });

  function setKeyIssue(selectedIndex: number, checked: boolean) {
    fields.forEach((_, i) => {
      form.setValue(`blockers.${i}.isKeyIssue`, checked && i === selectedIndex, {
        shouldDirty: true,
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blockers &amp; challenges</CardTitle>
        <CardDescription>
          What got in your way this week. Flag one as the key issue if it needs the manager&apos;s
          attention most.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No blockers reported.</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3 rounded-md border border-border p-3">
            <FormField
              control={form.control}
              name={`blockers.${index}.description`}
              render={({ field }) => (
                <FormItem className="flex-1 gap-1">
                  <FormControl>
                    <Textarea placeholder="Describe the blocker" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col items-center gap-2 pt-1">
              <FormField
                control={form.control}
                name={`blockers.${index}.isKeyIssue`}
                render={({ field }) => (
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id={`key-issue-${index}`}
                      checked={field.value ?? false}
                      onCheckedChange={(checked) => setKeyIssue(index, checked === true)}
                    />
                    <Label htmlFor={`key-issue-${index}`} className="text-xs font-normal text-muted-foreground">
                      Key issue
                    </Label>
                  </div>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Remove blocker"
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}

        <FormField
          control={form.control}
          name="blockers"
          render={() => <FormMessage />}
        />

        <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_BLOCKER)}>
          <Plus className="size-4" />
          Add blocker
        </Button>
      </CardContent>
    </Card>
  );
}
