import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization } from "./organization";
import { service } from "./service";

export const coupon = pgTable(
  "coupon",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    code: text("code").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    discountType: text("discount_type").notNull(), // FIXED | PERCENT

    fixedAmount: text("fixed_amount"),
    percentOff: integer("percent_off"),
    currency: text("currency").notNull(),

    usageLimitTotal: integer("usage_limit_total").notNull(),
    usageLimitPerCustomer: integer("usage_limit_per_customer").notNull(),
    expiresAt: timestamp("expires_at"),

    // Null means coupon applies to all services in the org.
    serviceId: text("service_id").references(() => service.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => {
    return {
      couponOrgCodeUnique: uniqueIndex("coupon_org_code_unique").on(
        table.organizationId,
        table.code,
      ),
    };
  },
);

