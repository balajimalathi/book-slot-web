"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { BlackoutDateRangeSchema } from "@/lib/validations/blackout-date";

type BlackoutRangeInput = z.infer<typeof BlackoutDateRangeSchema>;

type BlackoutRow = {
  id: string;
  from: string;
  to: string;
  reason: string | null;
  staffId: string | null;
};

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function BlackoutsSettingsClient({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [blackouts, setBlackouts] = useState<BlackoutRow[]>([]);

  const defaultFrom = useMemo(() => todayISODate(), []);

  const form = useForm<BlackoutRangeInput>({
    resolver: zodResolver(BlackoutDateRangeSchema),
    defaultValues: {
      from: defaultFrom,
      to: defaultFrom,
      staffId: null,
      reason: "",
    },
    mode: "onTouched",
  });

  async function refresh() {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/blackouts`, {
        credentials: "include",
      });
      if (!res.ok) {
        setServerError("Failed to load blackouts.");
        return;
      }
      const data = (await res.json()) as { blackouts: BlackoutRow[] };
      setBlackouts(data.blackouts);
    } catch {
      setServerError("Failed to load blackouts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function onSubmit(values: BlackoutRangeInput) {
    setServerError(null);
    setSaving(true);
    try {
      const payload = {
        from: values.from,
        to: values.to,
        // Keep org-wide by default.
        staffId: values.staffId ?? null,
        reason: values.reason?.trim() ? values.reason.trim() : undefined,
      };

      const res = await fetch(`/api/orgs/${orgId}/blackouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setServerError("Failed to save blackout.");
        return;
      }

      form.reset({
        from: values.from,
        to: values.to,
        staffId: null,
        reason: "",
      });
      await refresh();
    } catch {
      setServerError("Failed to save blackout.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: BlackoutRow) {
    if (deletingId) return;
    setServerError(null);
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/orgs/${orgId}/blackouts/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setServerError("Failed to delete blackout.");
        return;
      }
      await refresh();
    } catch {
      setServerError("Failed to delete blackout.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Blackouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Travel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Add blackout"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() =>
                    form.reset({
                      from: defaultFrom,
                      to: defaultFrom,
                      staffId: null,
                      reason: "",
                    })
                  }
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>

          <div className="overflow-hidden rounded-lg border">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : blackouts.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No blackouts configured.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Range</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blackouts.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.from}
                        {row.to !== row.from ? ` -> ${row.to}` : ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.reason ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={deletingId === row.id}
                          onClick={() => onDelete(row)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

