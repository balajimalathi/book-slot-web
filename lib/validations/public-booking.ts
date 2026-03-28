import { z } from "zod";

import { PaymentModeSchema } from "@/lib/validations/payment";

export const PublicBookingCreateRequestSchema = z.object({
  orgId: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  paymentMode: PaymentModeSchema.default("FULL"),
});

export const PublicBookingCreateResponseSchema = z.object({
  bookingId: z.string().min(1),
  referenceCode: z.string().min(1),
  orgId: z.string().min(1),
  serviceId: z.string().min(1),
  paymentGateway: z.enum(["RAZORPAY", "DODOPAYMENTS"]),
  paymentMode: PaymentModeSchema,
});

export const PublicOrgBookingDataSchema = z.object({
  organization: z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    bookingHeadline: z.string().nullable(),
    timezone: z.string().min(1),
    currency: z.string().min(1),
    paymentGateway: z.enum(["RAZORPAY", "DODOPAYMENTS"]),
  }),
  services: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string().nullable(),
      durationMinutes: z.number().int().positive(),
      price: z.string().min(1),
      depositAmount: z.string().nullable(),
      currency: z.string().min(1),
      staffIds: z.array(z.string()),
    }),
  ),
});

export type PublicBookingCreateRequest = z.infer<
  typeof PublicBookingCreateRequestSchema
>;
