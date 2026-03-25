"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { OrganizationCoreSettingsSchema } from "@/lib/validations/organization-core";

type OrganizationCoreSettingsInput = z.infer<
  typeof OrganizationCoreSettingsSchema
>;

const emptyDefaults: OrganizationCoreSettingsInput = {
  name: "",
  email: null,
  phone: null,
  logoUrl: null,
  primaryColor: null,
  bookingHeadline: null,
  currency: "INR",
  minAdvanceHours: 0,
  maxAdvanceDays: 365,
  bufferMinutes: 0,
  cancellationPolicyHours: 24,
  paymentGateway: "RAZORPAY",
  razorpayKeyId: null,
  razorpayKeySecret: null,
  dodopayClientId: null,
  dodopayClientSecret: null,
};

export function OrganizationCoreSettingsClient({
  orgId,
}: {
  orgId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<OrganizationCoreSettingsInput>({
    resolver: zodResolver(OrganizationCoreSettingsSchema),
    defaultValues: emptyDefaults,
    mode: "onTouched",
  });

  async function refresh() {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/organization`, {
        credentials: "include",
      });
      if (!res.ok) {
        setServerError("Failed to load organization configuration.");
        return;
      }
      const data = (await res.json()) as {
        organization: Record<string, any>;
      };
      const org = data.organization;

      form.reset({
        name: org.name ?? "",
        email: org.email ?? null,
        phone: org.phone ?? null,
        logoUrl: org.logoUrl ?? null,
        primaryColor: org.primaryColor ?? null,
        bookingHeadline: org.bookingHeadline ?? null,
        currency: org.currency ?? "INR",
        minAdvanceHours: org.minAdvanceHours ?? 0,
        maxAdvanceDays: org.maxAdvanceDays ?? 365,
        bufferMinutes: org.bufferMinutes ?? 0,
        cancellationPolicyHours: org.cancellationPolicyHours ?? 24,
        paymentGateway: org.paymentGateway ?? "RAZORPAY",
        razorpayKeyId: org.razorpayKeyId ?? null,
        razorpayKeySecret: org.razorpayKeySecret ?? null,
        dodopayClientId: org.dodopayClientId ?? null,
        dodopayClientSecret: org.dodopayClientSecret ?? null,
      });
    } catch {
      setServerError("Failed to load organization configuration.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function onSubmit(values: OrganizationCoreSettingsInput) {
    setServerError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/organization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        setServerError("Failed to save organization configuration.");
        return;
      }
      await refresh();
    } catch {
      setServerError("Failed to save organization configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
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
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Acme Inc" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bookingHeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking headline (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Book meetings with ease"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            type="email"
                            placeholder="admin@example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="+1 555 1234"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="https://example.com/logo.png"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary color (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="#0ea5e9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minAdvanceHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min advance hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={72}
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

                  <FormField
                    control={form.control}
                    name="maxAdvanceDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max advance days</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={365}
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

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cancellationPolicyHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cancellation policy hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={168}
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

                  <FormField
                    control={form.control}
                    name="paymentGateway"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment gateway</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gateway" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RAZORPAY">
                              RAZORPAY
                            </SelectItem>
                            <SelectItem value="DODOPAYMENTS">
                              DODOPAYMENTS
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="razorpayKeyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razorpay Key ID (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="rzp_live_..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="razorpayKeySecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razorpay Key Secret (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            type="password"
                            placeholder="********"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dodopayClientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DodoPay Client ID (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dodopayClientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DodoPay Client Secret (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            type="password"
                            placeholder="********"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save organization"}
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

