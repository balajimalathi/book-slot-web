import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "./organization";

export const blackoutDate = pgTable("blackout_date", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // When null, blackout is organization-wide.
  staffId: text("staff_id"),

  // Stored as timestamps at the org timezone midnight.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),

  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

