import { NextResponse } from "next/server";

import { getWebhookSecret, mapWebhookEventToStatus } from "@/lib/payments/mock";
import { updateBookingPaymentByReferenceCode } from "@/lib/payments/booking-payment";
import { RazorpayWebhookSchema } from "@/lib/validations/payment";

export async function POST(request: Request) {
  const signature = request.headers.get("x-mock-signature");
  if (signature !== getWebhookSecret()) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = RazorpayWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing x-org-id header" }, { status: 400 });
  }

  const mapped = mapWebhookEventToStatus(parsed.data.eventType);
  await updateBookingPaymentByReferenceCode({
    organizationId: orgId,
    referenceCode: parsed.data.referenceCode,
    paymentGateway: "RAZORPAY",
    paymentStatus: mapped.paymentStatus,
    bookingStatus: mapped.bookingStatus,
  });

  return NextResponse.json({
    received: true,
    gateway: "RAZORPAY",
    eventId: parsed.data.eventId ?? null,
    eventType: parsed.data.eventType,
  });
}
