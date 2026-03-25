import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "./organization";
import { service } from "./service";
import { customer } from "./customer";
import { coupon } from "./coupon";

export const booking = pgTable("booking", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  serviceId: text("service_id")
    .notNull()
    .references(() => service.id, { onDelete: "cascade" }),

  // Stored as staff identifier; staff are modeled outside of this table for now.
  staffId: text("staff_id").notNull(),

  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),

  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),

  status: text("status").notNull(), // UPCOMING | COMPLETED | CANCELLED | NO_SHOW

  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  notes: text("notes"),

  paymentGateway: text("payment_gateway"),
  paymentMode: text("payment_mode").notNull(), // FULL | DEPOSIT | FREE
  paymentStatus: text("payment_status"),

  amountTotal: text("amount_total").notNull(),
  amountDeposit: text("amount_deposit"),

  couponId: text("coupon_id").references(() => coupon.id, {
    onDelete: "set null",
  }),

  referenceCode: text("reference_code").notNull().unique(),

  cancelledAt: timestamp("cancelled_at"),

  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

