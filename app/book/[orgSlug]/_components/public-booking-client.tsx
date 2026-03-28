"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ORG_WIDE_STAFF_ID } from "@/lib/constants/availability";

const FormSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  staffId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date"),
  startTime: z.string().min(1, "Time slot is required"),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  paymentMode: z.enum(["FULL", "DEPOSIT", "FREE"]),
});

type FormValues = z.infer<typeof FormSchema>;

type PublicBookingProps = {
  org: {
    id: string;
    slug: string;
    name: string;
    bookingHeadline: string | null;
    timezone: string;
    currency: string;
    paymentGateway: "RAZORPAY" | "DODOPAYMENTS";
  };
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    price: string;
    depositAmount: string | null;
    currency: string;
    staffIds: string[];
  }>;
};

type BookingResult =
  | {
    status: "idle";
    message?: undefined;
  }
  | {
    status: "success" | "error";
    message: string;
  };

export function PublicBookingClient({ org, services }: PublicBookingProps) {
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [lastReferenceCode, setLastReferenceCode] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult>({ status: "idle" });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      serviceId: "",
      staffId: "",
      date: "",
      startTime: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
      paymentMode: "FULL",
    },
  });

  const selectedService = useMemo(
    () => services.find((service) => service.id === form.watch("serviceId")),
    [form, services],
  );

  const staffOptions = selectedService?.staffIds ?? [];
  const requiresStaffSelection = staffOptions.length > 1;

  function resolveStaffId(values: FormValues): string | null {
    if (requiresStaffSelection) {
      return values.staffId && values.staffId !== "" ? values.staffId : null;
    }
    if (staffOptions.length === 1) {
      return staffOptions[0];
    }
    return ORG_WIDE_STAFF_ID;
  }

  async function loadSlots() {
    const values = form.getValues();
    const resolvedStaffId = resolveStaffId(values);
    if (!values.serviceId || !resolvedStaffId || !values.date) {
      setSlots([]);
      if (values.serviceId && !values.date) {
        setBookingResult({ status: "error", message: "Please select a date first." });
      } else if (requiresStaffSelection) {
        setBookingResult({ status: "error", message: "Please select a staff member first." });
      }
      return;
    }
    setSlotsLoading(true);
    setBookingResult({ status: "idle" });
    try {
      const query = new URLSearchParams({
        orgId: org.id,
        serviceId: values.serviceId,
        staffId: resolvedStaffId,
        date: values.date,
      });
      const res = await fetch(`/api/booking/slots?${query.toString()}`);
      const json = (await res.json()) as { slots?: string[]; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Unable to fetch available slots");
      }
      setSlots(Array.isArray(json.slots) ? json.slots : []);
      if (!json.slots?.includes(form.getValues("startTime") ?? "")) {
        form.setValue("startTime", "");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to fetch slots";
      setSlots([]);
      setBookingResult({ status: "error", message });
    } finally {
      setSlotsLoading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setBookingResult({ status: "idle" });
    setLastReferenceCode(null);
    const resolvedStaffId = resolveStaffId(values);
    if (!resolvedStaffId) {
      setBookingResult({ status: "error", message: "Please select a staff member." });
      return;
    }

    try {
      const bookingRes = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          orgId: org.id,
          staffId: resolvedStaffId,
        }),
      });
      const bookingJson = (await bookingRes.json()) as {
        error?: string;
        referenceCode?: string;
      };
      if (!bookingRes.ok || !bookingJson.referenceCode) {
        throw new Error(bookingJson.error ?? "Failed to create booking");
      }

      const paymentPath =
        org.paymentGateway === "DODOPAYMENTS"
          ? "/api/payments/dodopay/create-checkout"
          : "/api/payments/razorpay/create-order";
      const paymentRes = await fetch(paymentPath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgId: org.id,
          serviceId: values.serviceId,
          referenceCode: bookingJson.referenceCode,
          paymentMode: values.paymentMode,
        }),
      });
      const paymentJson = (await paymentRes.json()) as {
        error?: string;
        orderId?: string;
        checkoutUrl?: string;
      };
      if (!paymentRes.ok) {
        throw new Error(paymentJson.error ?? "Failed to initialize payment");
      }

      if (paymentJson.checkoutUrl) {
        window.location.href = paymentJson.checkoutUrl;
        return;
      }
      setLastReferenceCode(bookingJson.referenceCode);

      setBookingResult({
        status: "success",
        message: `Booking created. Reference code: ${bookingJson.referenceCode}. Payment order initialized.`,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to complete booking";
      setBookingResult({ status: "error", message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{org.bookingHeadline ?? `Book an appointment with ${org.name}`}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground">
          Timezone: {org.timezone} · Payment: {org.paymentGateway}
        </div>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("staffId", undefined);
                        form.setValue("startTime", "");
                        setSlots([]);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} ({service.durationMinutes}m)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requiresStaffSelection ? (
              <FormField
                control={form.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("startTime", "");
                          setSlots([]);
                        }}
                        value={field.value ?? ""}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffOptions.map((staffId) => (
                            <SelectItem key={staffId} value={staffId}>
                              {staffId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {staffOptions.length === 1
                  ? `Assigned staff: ${staffOptions[0]}`
                  : "Staff selection is not required for this service."}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        onChange={(event) => {
                          field.onChange(event);
                          form.setValue("startTime", "");
                          setSlots([]);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Slot</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an available slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {slots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button onClick={loadSlots} type="button" variant="outline" disabled={slotsLoading}>
              {slotsLoading ? "Loading slots..." : "Check availability"}
            </Button>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Jane Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="jane@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+91..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FULL">Full payment</SelectItem>
                          <SelectItem value="DEPOSIT">Deposit</SelectItem>
                          <SelectItem value="FREE">Free booking</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Any additional details" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Confirm and continue
            </Button>
          </form>
        </Form>

        {bookingResult.status !== "idle" ? (
          <div
            className={
              bookingResult.status === "success"
                ? "rounded-md border border-border bg-muted p-3 text-sm"
                : "rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            }
          >
            {bookingResult.message}
          </div>
        ) : null}

        {lastReferenceCode ? (
          <div className="rounded-md border border-border p-3">
            <div className="mb-2 text-sm text-muted-foreground">
              For local mock flow, confirm payment outcome for{" "}
              <span className="font-medium text-foreground">{lastReferenceCode}</span>.
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  const res = await fetch("/api/public/payments/mock-complete", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      orgId: org.id,
                      referenceCode: lastReferenceCode,
                      gateway: org.paymentGateway,
                      status: "SUCCESS",
                    }),
                  });
                  if (res.ok) {
                    setBookingResult({
                      status: "success",
                      message: `Payment confirmed for ${lastReferenceCode}.`,
                    });
                  }
                }}
              >
                Mark payment success
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const res = await fetch("/api/public/payments/mock-complete", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      orgId: org.id,
                      referenceCode: lastReferenceCode,
                      gateway: org.paymentGateway,
                      status: "FAILED",
                    }),
                  });
                  if (res.ok) {
                    setBookingResult({
                      status: "error",
                      message: `Payment failed for ${lastReferenceCode}.`,
                    });
                  }
                }}
              >
                Mark payment failed
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
