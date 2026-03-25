"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { AvailabilitySettingsSchema } from "@/lib/validations/availability-settings";

type AvailabilitySettingsInput = z.infer<typeof AvailabilitySettingsSchema>;

const dayLabels = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function createDefaultValues(): AvailabilitySettingsInput {
  const defaultDay = { isActive: false, startTime: "09:00", endTime: "17:00" };
  return {
    bufferMinutes: 0,
    days: Array.from({ length: 7 }).map(() => ({ ...defaultDay })) as AvailabilitySettingsInput["days"],
  };
}

export function AvailabilitySettingsClient({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<AvailabilitySettingsInput>({
    resolver: zodResolver(AvailabilitySettingsSchema),
    defaultValues: createDefaultValues(),
    mode: "onTouched",
  });

  async function refresh() {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/availability`, {
        credentials: "include",
      });
      if (!res.ok) {
        setServerError("Failed to load availability.");
        return;
      }
      const data = (await res.json()) as { availability: AvailabilitySettingsInput };
      form.reset(data.availability);
    } catch {
      setServerError("Failed to load availability.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function onSubmit(values: AvailabilitySettingsInput) {
    setServerError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        setServerError("Failed to save availability.");
        return;
      }
      await refresh();
    } catch {
      setServerError("Failed to save availability.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="bufferMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buffer minutes</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={120}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead className="w-24">Open</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayLabels.map((label, index) => (
                        <TableRow key={label}>
                          <TableCell className="font-medium">
                            {label}
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`days.${index}.isActive` as any}
                              render={({ field }) => (
                                <FormItem className="flex items-center">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={(v) =>
                                        field.onChange(v === true)
                                      }
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`days.${index}.startTime` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="time" step={60} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`days.${index}.endTime` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="time" step={60} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save availability"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => refresh()}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

