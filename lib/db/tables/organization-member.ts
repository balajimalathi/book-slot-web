import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { organization } from "./organization";
import { user } from "./user";

export const organizationMember = pgTable(
  "organization_member",
  {
    id: text("id").primaryKey(),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // App-level role used for dashboard permissions and onboarding skipping.
    role: text("role").notNull().default("admin"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => {
    return {
      // Enforce single org per user (based on your onboarding constraints).
      organizationMemberUserUnique: uniqueIndex(
        "organization_member_user_unique",
      ).on(table.userId),
    };
  },
);

