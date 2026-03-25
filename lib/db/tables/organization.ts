import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const organization = pgTable("organization", {
  // BetterAuth "orgId"
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // Collected during onboarding (org-scoped admin).
  email: text("email"),
  phone: text("phone"),
  slug: text("slug").notNull().unique(),

  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  bookingHeadline: text("booking_headline"),

  timezone: text("timezone").notNull().default("UTC"),
  currency: text("currency").notNull(),

  minAdvanceHours: integer("min_advance_hours").notNull(),
  maxAdvanceDays: integer("max_advance_days").notNull(),
  bufferMinutes: integer("buffer_minutes").notNull(),
  cancellationPolicyHours: integer("cancellation_policy_hours").notNull(),

  paymentGateway: text("payment_gateway").notNull().default("RAZORPAY"),
  razorpayKeyId: text("razorpay_key_id"),
  razorpayKeySecret: text("razorpay_key_secret"),
  dodopayClientId: text("dodopay_client_id"),
  dodopayClientSecret: text("dodopay_client_secret"),

  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

