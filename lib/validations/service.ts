import { z } from "zod";

export const ServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().max(1000).optional().or(z.literal("")),
  durationMinutes: z
    .number()
    .int()
    .min(5, "Duration must be at least 5 minutes")
    .max(24 * 60, "Duration must be less than 24 hours"),
  price: z
    .string()
    .min(1, "Price is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid amount"),
  depositAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Deposit must be a valid amount")
    .nullable()
    .optional(),
  currency: z.string().min(1, "Currency is required"),
  isActive: z.boolean().default(true),
});

export type ServiceInput = z.infer<typeof ServiceSchema>;

