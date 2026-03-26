import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db/db";
import { service as serviceTable } from "@/lib/db/schema";
import {
  CreateDodoPayCheckoutResponseSchema,
  CreatePaymentOrderRequestSchema,
} from "@/lib/validations/payment";
import {
  createMockCheckoutUrl,
  resolveAmountForPaymentMode,
  toMockId,
} from "@/lib/payments/mock";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreatePaymentOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { orgId, serviceId, referenceCode, paymentMode } = parsed.data;

  const [serviceRow] = await db
    .select({
      price: serviceTable.price,
      depositAmount: serviceTable.depositAmount,
      currency: serviceTable.currency,
    })
    .from(serviceTable)
    .where(
      and(
        eq(serviceTable.organizationId, orgId),
        eq(serviceTable.id, serviceId),
      ),
    );

  if (!serviceRow) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const amount = resolveAmountForPaymentMode({
    totalAmount: serviceRow.price,
    depositAmount: serviceRow.depositAmount,
    paymentMode,
  });

  const checkoutId = toMockId("mock_checkout", referenceCode);
  const response = CreateDodoPayCheckoutResponseSchema.parse({
    checkoutUrl: createMockCheckoutUrl(checkoutId),
    checkoutId,
    amount,
    currency: serviceRow.currency,
    referenceCode,
  });

  return NextResponse.json(response);
}
