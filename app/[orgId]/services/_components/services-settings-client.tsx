"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ServiceSchema } from "@/lib/validations/service";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  depositAmount: string | null;
  currency: "INR" | "USD";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const emptyServiceValues: z.infer<typeof ServiceSchema> = {
  name: "",
  description: "",
  durationMinutes: 30,
  price: "",
  depositAmount: null,
  currency: "INR",
  isActive: true,
};

function serviceToPayload(values: z.infer<typeof ServiceSchema>) {
  return {
    ...values,
    description: values.description ?? "",
    depositAmount: values.depositAmount ?? null,
  };
}

export function ServicesSettingsClient({ orgId }: { orgId: string }) {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof ServiceSchema>>({
    resolver: zodResolver(ServiceSchema as never),
    defaultValues: emptyServiceValues,
    mode: "onTouched",
  });

  async function refresh() {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/services`, {
        credentials: "include",
      });
      if (!res.ok) {
        setServerError("Failed to load services.");
        return;
      }
      const data = (await res.json()) as { services: any[] };
      setServices(
        data.services.map((s) => ({
          ...s,
          depositAmount: s.depositAmount ?? null,
          description: s.description ?? null,
        })) as ServiceRow[],
      );
    } catch {
      setServerError("Failed to load services.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function onCreate(values: z.infer<typeof ServiceSchema>) {
    setServerError(null);
    try {
      const res = await fetch(`/api/orgs/${orgId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(serviceToPayload(values)),
      });
      if (!res.ok) {
        setServerError("Failed to create service.");
        return;
      }
      form.reset(emptyServiceValues);
      await refresh();
    } catch {
      setServerError("Failed to create service.");
    }
  }

  async function onToggleActive(service: any) {
    if (savingId) return;
    setServerError(null);
    setSavingId(service.id);
    try {
      const payload = serviceToPayload({
        name: service.name,
        description: service.description ?? "",
        durationMinutes: service.durationMinutes,
        price: service.price,
        depositAmount: service.depositAmount ?? null,
        currency: service.currency,
        isActive: !service.isActive,
      });

      const res = await fetch(`/api/orgs/${orgId}/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setServerError("Failed to update service.");
        return;
      }

      await refresh();
    } catch {
      setServerError("Failed to update service.");
    } finally {
      setSavingId(null);
    }
  }

  async function onDelete(service: any) {
    if (savingId) return;
    setServerError(null);
    setSavingId(service.id);
    try {
      const res = await fetch(`/api/orgs/${orgId}/services/${service.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setServerError("Failed to delete service.");
        return;
      }
      await refresh();
    } catch {
      setServerError("Failed to delete service.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service name</FormLabel>
                      <FormControl>
                        <Input placeholder="Consultation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="INR or USD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="What this service includes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={24 * 60}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v.trim() === "" ? null : v);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) =>
                          field.onChange(v === true)
                        }
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="m-0">Active</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enabled services can be booked by customers.
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3">
                <Button type="submit">Create service</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset(emptyServiceValues)}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Existing services</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : services.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No services configured yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="max-w-xs truncate">
                      {s.name}
                    </TableCell>
                    <TableCell>{s.durationMinutes} min</TableCell>
                    <TableCell>
                      {s.currency} {s.price}
                    </TableCell>
                    <TableCell>{s.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={savingId === s.id}
                          onClick={() => onToggleActive(s)}
                        >
                          {s.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={savingId === s.id}
                          onClick={() => onDelete(s)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

