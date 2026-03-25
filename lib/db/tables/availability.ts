import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization } from "./organization";

export const availability = pgTable(
  "availability",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Staff identifier (no FK for now; staff are not modeled as separate rows yet).
    staffId: text("staff_id").notNull(),

    // 0–6 (Mon–Sun mapping decided in the app).
    weekday: integer("weekday").notNull(),
    isActive: boolean("is_active").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => {
    return {
      availabilityOrgStaffWeekdayUnique: uniqueIndex(
        "availability_org_staff_weekday_unique",
      ).on(table.organizationId, table.staffId, table.weekday),
    };
  },
);

