import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => {
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
  }, schema);

export const OrganizationCoreSettingsSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  email: emptyToNull(
    z.string().email("Enter a valid email").nullable().optional(),
  ),
  phone: emptyToNull(
    z.string().min(1, "Phone is required").nullable().optional(),
  ),
  logoUrl: emptyToNull(
    z.string().url("Logo must be a valid URL").nullable().optional(),
  ),
  primaryColor: emptyToNull(z.string().nullable().optional()),
  bookingHeadline: emptyToNull(z.string().nullable().optional()),

  currency: z.enum(["INR", "USD"]),
  minAdvanceHours: z
    .coerce.number()
    .int()
    .min(0, "Min advance hours must be >= 0")
    .max(72, "Min advance hours must be <= 72"),
  maxAdvanceDays: z
    .coerce.number()
    .int()
    .min(1, "Max advance days must be >= 1")
    .max(365, "Max advance days must be <= 365"),
  bufferMinutes: z
    .coerce.number()
    .int()
    .min(0, "Buffer must be at least 0 minutes")
    .max(120, "Buffer cannot exceed 120 minutes"),
  cancellationPolicyHours: z
    .coerce.number()
    .int()
    .min(0, "Cancellation policy must be >= 0")
    .max(168, "Cancellation policy cannot exceed 168 hours"),

  paymentGateway: z
    .enum(["RAZORPAY", "DODOPAYMENTS"])
    .optional()
    .default("RAZORPAY"),

  razorpayKeyId: emptyToNull(z.string().nullable().optional()),
  razorpayKeySecret: emptyToNull(z.string().nullable().optional()),
  dodopayClientId: emptyToNull(z.string().nullable().optional()),
  dodopayClientSecret: emptyToNull(z.string().nullable().optional()),
});

export type OrganizationCoreSettingsInput = z.infer<
  typeof OrganizationCoreSettingsSchema
>;

