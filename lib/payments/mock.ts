import { env } from "@/env";

type PaymentEventType = "payment.captured" | "payment.failed" | "refund.processed";

export function parseAmount(raw: string | null | undefined): number {
  if (!raw) return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function toMockId(prefix: string, seed: string): string {
  const normalized = seed.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${prefix}_${normalized}_${Date.now()}`;
}

export function resolveAmountForPaymentMode(input: {
  totalAmount: string;
  depositAmount: string | null;
  paymentMode: "FULL" | "DEPOSIT" | "FREE";
}): number {
  if (input.paymentMode === "FREE") return 0;
  if (input.paymentMode === "DEPOSIT") {
    return parseAmount(input.depositAmount) || parseAmount(input.totalAmount);
  }
  return parseAmount(input.totalAmount);
}

export function getWebhookSecret(): string {
  return env.MOCK_PAYMENT_WEBHOOK_SECRET || "mock_webhook_secret";
}

export function getCallbackToken(): string {
  return env.MOCK_PAYMENT_CALLBACK_TOKEN || "mock_callback_token";
}

export function mapWebhookEventToStatus(eventType: PaymentEventType): {
  paymentStatus: "CONFIRMED" | "FAILED" | "REFUNDED";
  bookingStatus: "UPCOMING" | "CANCELLED";
} {
  if (eventType === "payment.captured") {
    return { paymentStatus: "CONFIRMED", bookingStatus: "UPCOMING" };
  }

  if (eventType === "payment.failed") {
    return { paymentStatus: "FAILED", bookingStatus: "CANCELLED" };
  }

  return { paymentStatus: "REFUNDED", bookingStatus: "CANCELLED" };
}

export function createMockCheckoutUrl(checkoutId: string): string {
  return `${env.NEXT_PUBLIC_URL}/mock/payments/dodopay/${checkoutId}`;
}
