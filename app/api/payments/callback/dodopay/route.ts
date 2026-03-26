import { NextResponse } from "next/server";

import { getCallbackToken } from "@/lib/payments/mock";
import { updateBookingPaymentByReferenceCode } from "@/lib/payments/booking-payment";
import { DodoPayCallbackSchema } from "@/lib/validations/payment";

export async function POST(request: Request) {
  const callbackToken = request.headers.get("x-mock-callback-token");
  if (callbackToken !== getCallbackToken()) {
    return NextResponse.json({ error: "Unauthorized callback token" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = DodoPayCallbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid callback payload" }, { status: 400 });
  }

  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing x-org-id header" }, { status: 400 });
  }

  const update = await updateBookingPaymentByReferenceCode({
    organizationId: orgId,
    referenceCode: parsed.data.referenceCode,
    paymentGateway: "DODOPAYMENTS",
    paymentStatus: parsed.data.status === "SUCCESS" ? "CONFIRMED" : "FAILED",
    bookingStatus: parsed.data.status === "SUCCESS" ? "UPCOMING" : "CANCELLED",
  });

  if (!update.found) {
    return NextResponse.json({ error: "Booking not found for referenceCode" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    gateway: "DODOPAYMENTS",
    referenceCode: parsed.data.referenceCode,
  });
}
