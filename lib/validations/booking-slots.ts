import { z } from "zod";

export const BookingSlotsQuerySchema = z.object({
  orgId: z.string().min(1, "orgId is required"),
  staffId: z.string().min(1, "staffId is required"),
  serviceId: z.string().min(1, "serviceId is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export type BookingSlotsQuery = z.infer<typeof BookingSlotsQuerySchema>;
