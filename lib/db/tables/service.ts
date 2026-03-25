import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";

import { organization } from "./organization";

export const service = pgTable("service", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  description: text("description"),

  durationMinutes: integer("duration_minutes").notNull(),
  price: text("price").notNull(),
  depositAmount: text("deposit_amount"),
  currency: text("currency").notNull(),

  isActive: boolean("is_active").notNull().default(true),
  imageUrl: text("image_url"),

  // Staff identifiers that can perform this service.
  // We store staff ids as text array since staff aren't separate DB rows yet.
  staffIds: jsonb("staff_ids").notNull().default([] as string[]),

  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

