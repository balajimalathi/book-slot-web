import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { uniqueIndex } from "drizzle-orm/pg-core";

import { organization } from "./organization";

export const customer = pgTable(
  "customer",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    notes: text("notes"),

    tags: jsonb("tags").notNull().default([] as string[]),
    totalSpend: text("total_spend").notNull().default("0"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => {
    return {
      customerOrgEmailUnique: uniqueIndex("customer_org_email_unique").on(
        table.organizationId,
        table.email,
      ),
    };
  },
);

