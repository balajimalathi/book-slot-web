import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/db";
import { booking as bookingTable } from "@/lib/db/schema";

export async function updateBookingPaymentByReferenceCode(input: {
  organizationId: string;
  referenceCode: string;
  paymentGateway: "RAZORPAY" | "DODOPAYMENTS";
  paymentMode?: "FULL" | "DEPOSIT" | "FREE";
  paymentStatus: "CONFIRMED" | "FAILED" | "REFUNDED";
  bookingStatus: "UPCOMING" | "CANCELLED";
}) {
  const [row] = await db
    .select({
      id: bookingTable.id,
      paymentStatus: bookingTable.paymentStatus,
      status: bookingTable.status,
    })
    .from(bookingTable)
    .where(
      and(
        eq(bookingTable.organizationId, input.organizationId),
        eq(bookingTable.referenceCode, input.referenceCode),
      ),
    );

  if (!row) {
    return { found: false };
  }

  // Ignore duplicate or out-of-order updates that would downgrade a settled booking.
  if (
    row.paymentStatus === "CONFIRMED" &&
    input.paymentStatus !== "CONFIRMED" &&
    row.status !== "CANCELLED"
  ) {
    return { found: true };
  }

  const now = new Date();
  await db
    .update(bookingTable)
    .set({
      paymentGateway: input.paymentGateway,
      paymentMode: input.paymentMode,
      paymentStatus: input.paymentStatus,
      status: input.bookingStatus,
      cancelledAt: input.bookingStatus === "CANCELLED" ? now : null,
      updatedAt: now,
    })
    .where(eq(bookingTable.id, row.id));

  return { found: true };
}
