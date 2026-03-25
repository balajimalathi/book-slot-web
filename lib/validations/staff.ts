import { z } from "zod";

export const StaffProfileSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  bio: z
    .string()
    .max(1000, "Bio must be at most 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type StaffProfileInput = z.infer<typeof StaffProfileSchema>;

