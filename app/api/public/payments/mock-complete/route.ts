import { NextResponse } from "next/server";

import { updateBookingPaymentByReferenceCode } from "@/lib/payments/booking-payment";
import { MockPaymentCompleteSchema } from "@/lib/validations/payment";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = MockPaymentCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { orgId, referenceCode, gateway, status } = parsed.data;
  const update = await updateBookingPaymentByReferenceCode({
    organizationId: orgId,
    referenceCode,
    paymentGateway: gateway,
    paymentStatus: status === "SUCCESS" ? "CONFIRMED" : "FAILED",
    bookingStatus: status === "SUCCESS" ? "UPCOMING" : "CANCELLED",
  });

  if (!update.found) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
