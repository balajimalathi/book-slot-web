import { z } from "zod";

export const OrganizationOnboardingSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use only lowercase letters, numbers, and hyphens"),
  logo: z.string().url("Logo must be a valid URL").nullable().optional(),
  primaryColor: z.string().optional(),
  bookingHeadline: z.string().optional(),
  // Timezone is fixed to UTC globally; we keep the field for typings but do not expose it in UI.
  timezone: z.literal("UTC").default("UTC"),
  currency: z.enum(["INR", "USD"]),
  minAdvanceHours: z.number().int().min(0).max(72),
  maxAdvanceDays: z.number().int().min(1).max(365),
  bufferMinutes: z.number().int().min(0).max(120),
  cancellationPolicyHours: z.number().int().min(0).max(168),
  paymentGateway: z.enum(["RAZORPAY", "DODOPAYMENTS"]).default("RAZORPAY"),
  razorpayKeyId: z.string().optional().nullable(),
  razorpayKeySecret: z.string().optional().nullable(),
  dodopayClientId: z.string().optional().nullable(),
  dodopayClientSecret: z.string().optional().nullable(),
});

export type OrganizationOnboardingInput = z.infer<typeof OrganizationOnboardingSchema>;

