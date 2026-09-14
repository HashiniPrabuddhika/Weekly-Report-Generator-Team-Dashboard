"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { EMPTY_ACHIEVEMENT, type ReportFormValues } from "./form-schema";

export function AchievementsSection() {
  const form = useFormContext<ReportFormValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "achievements" });

  function setKeyAchievement(selectedIndex: number, checked: boolean) {
    fields.forEach((_, i) => {
      form.setValue(`achievements.${i}.isKeyAchievement`, checked && i === selectedIndex, {
        shouldDirty: true,
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements &amp; highlights</CardTitle>
        <CardDescription>
          What went well this week. Flag one as the key achievement to highlight it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No achievements added yet.</p>
        )}

        {fields.map((field, index) => {
          const isKey = form.watch(`achievements.${index}.isKeyAchievement`);
          return (
            <div
              key={field.id}
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 transition-colors",
                isKey ? "border-accent bg-accent/5" : "border-border",
              )}
            >
              <FormField
                control={form.control}
                name={`achievements.${index}.description`}
                render={({ field }) => (
                  <FormItem className="flex-1 gap-1">
                    <FormControl>
                      <Textarea placeholder="Describe the achievement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col items-center gap-2 pt-1">
                <FormField
                  control={form.control}
                  name={`achievements.${index}.isKeyAchievement`}
                  render={({ field }) => (
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id={`key-achievement-${index}`}
                        checked={field.value ?? false}
                        onCheckedChange={(checked) => setKeyAchievement(index, checked === true)}
                      />
                      <Label
                        htmlFor={`key-achievement-${index}`}
                        className="flex items-center gap-1 text-xs font-normal text-muted-foreground"
                      >
                        <Sparkles className="size-3 text-accent" />
                        Key
                      </Label>
                    </div>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label="Remove achievement"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          );
        })}

        <FormField control={form.control} name="achievements" render={() => <FormMessage />} />

        <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_ACHIEVEMENT)}>
          <Plus className="size-4" />
          Add achievement
        </Button>
      </CardContent>
    </Card>
  );
}
