import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { fromZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";

import { db } from "@/lib/db/db";
import {
  booking as bookingTable,
  customer as customerTable,
  organization as organizationTable,
  service as serviceTable,
} from "@/lib/db/schema";
import { ORG_WIDE_STAFF_ID } from "@/lib/constants/availability";
import { PublicBookingCreateRequestSchema } from "@/lib/validations/public-booking";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = PublicBookingCreateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const input = parsed.data;
  const [orgRow] = await db
    .select({
      id: organizationTable.id,
      timezone: organizationTable.timezone,
      paymentGateway: organizationTable.paymentGateway,
    })
    .from(organizationTable)
    .where(eq(organizationTable.id, input.orgId))
    .limit(1);

  if (!orgRow) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const [serviceRow] = await db
    .select({
      id: serviceTable.id,
      organizationId: serviceTable.organizationId,
      durationMinutes: serviceTable.durationMinutes,
      isActive: serviceTable.isActive,
      price: serviceTable.price,
      depositAmount: serviceTable.depositAmount,
      staffIds: serviceTable.staffIds,
    })
    .from(serviceTable)
    .where(eq(serviceTable.id, input.serviceId))
    .limit(1);

  if (!serviceRow || serviceRow.organizationId !== input.orgId || !serviceRow.isActive) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const staffIds = Array.isArray(serviceRow.staffIds) ? serviceRow.staffIds : [];
  const resolvedStaffId =
    input.staffId && input.staffId !== ""
      ? input.staffId
      : staffIds.length === 1
        ? staffIds[0]
        : ORG_WIDE_STAFF_ID;
  if (staffIds.length > 1 && !staffIds.includes(resolvedStaffId)) {
    return NextResponse.json({ error: "Invalid staff selection" }, { status: 400 });
  }
  if (staffIds.length <= 1 && resolvedStaffId !== ORG_WIDE_STAFF_ID && !staffIds.includes(resolvedStaffId)) {
    return NextResponse.json({ error: "Invalid staff selection" }, { status: 400 });
  }

  const startAt = fromZonedTime(
    new Date(`${input.date}T${input.startTime}:00`),
    orgRow.timezone,
  );
  const endAt = new Date(startAt.getTime() + serviceRow.durationMinutes * 60 * 1000);
  const now = new Date();

  const [existingCustomer] = await db
    .select({ id: customerTable.id })
    .from(customerTable)
    .where(
      and(
        eq(customerTable.organizationId, input.orgId),
        eq(customerTable.email, input.customerEmail),
      ),
    )
    .limit(1);

  const customerId = existingCustomer?.id ?? randomUUID();
  if (existingCustomer) {
    await db
      .update(customerTable)
      .set({
        name: input.customerName,
        phone: input.customerPhone ?? null,
        notes: input.notes ?? null,
        updatedAt: now,
      })
      .where(eq(customerTable.id, existingCustomer.id));
  } else {
    await db.insert(customerTable).values({
      id: customerId,
      organizationId: input.orgId,
      email: input.customerEmail,
      name: input.customerName,
      phone: input.customerPhone ?? null,
      notes: input.notes ?? null,
      tags: [],
      totalSpend: "0",
      createdAt: now,
      updatedAt: now,
    });
  }

  const bookingId = randomUUID();
  const referenceCode = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  await db.insert(bookingTable).values({
    id: bookingId,
    organizationId: input.orgId,
    serviceId: input.serviceId,
    staffId: resolvedStaffId,
    customerId,
    startAt,
    endAt,
    status: "UPCOMING",
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone ?? null,
    notes: input.notes ?? null,
    paymentGateway:
      orgRow.paymentGateway === "DODOPAYMENTS" ? "DODOPAYMENTS" : "RAZORPAY",
    paymentMode: input.paymentMode,
    paymentStatus: input.paymentMode === "FREE" ? "CONFIRMED" : "PENDING",
    amountTotal: serviceRow.price,
    amountDeposit: serviceRow.depositAmount ?? null,
    couponId: null,
    referenceCode,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    bookingId,
    referenceCode,
    orgId: input.orgId,
    serviceId: input.serviceId,
    paymentGateway:
      orgRow.paymentGateway === "DODOPAYMENTS" ? "DODOPAYMENTS" : "RAZORPAY",
    paymentMode: input.paymentMode,
  });
}
