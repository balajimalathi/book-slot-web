import { z } from "zod";

const imageUrl = z
  .union([z.string().url("Enter a valid image URL"), z.literal("")])
  .optional()
  .nullable();

export const ProfileSettingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email"),
  timezone: z.string().min(1, "Select a timezone"),
  image: imageUrl,
});

export type ProfileSettingsInput = z.infer<typeof ProfileSettingsSchema>;
