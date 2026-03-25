import { z } from "zod";

const DayAvailabilitySchema = z.object({
  // Whether this day is open for bookings
  isActive: z.boolean(),
  // Local start time in HH:MM 24-hour format (interpreted in org timezone)
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  // Local end time in HH:MM 24-hour format (must be after start time at usage time)
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
});

export const AvailabilitySettingsSchema = z.object({
  /**
   * Index 0–6 representing Monday–Sunday in UI order.
   * We intentionally keep this as a fixed-length array so the form
   * can rely on positional indices for each weekday row.
   */
  days: z
    .array(DayAvailabilitySchema)
    .length(7, "Exactly 7 days of availability must be provided"),

  /**
   * Buffer in minutes between appointments.
   * This is stored at the organization level and used by the
   * availability engine to space out candidate slots.
   */
  bufferMinutes: z
    .number()
    .int()
    .min(0, "Buffer must be at least 0 minutes")
    .max(120, "Buffer cannot exceed 120 minutes"),
});

export type DayAvailabilityInput = z.infer<typeof DayAvailabilitySchema>;

export type AvailabilitySettingsInput = z.infer<typeof AvailabilitySettingsSchema>;

