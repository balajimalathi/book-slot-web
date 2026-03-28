import { z } from "zod";

export const PaymentGatewaySchema = z.enum(["RAZORPAY", "DODOPAYMENTS"]);
export const PaymentModeSchema = z.enum(["FULL", "DEPOSIT", "FREE"]);

export const CreatePaymentOrderRequestSchema = z.object({
  orgId: z.string().min(1),
  serviceId: z.string().min(1),
  referenceCode: z.string().min(1),
  paymentMode: PaymentModeSchema.default("FULL"),
});

export const CreateRazorpayOrderResponseSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().min(1),
  key: z.string().min(1),
  referenceCode: z.string().min(1),
});

export const CreateDodoPayCheckoutResponseSchema = z.object({
  checkoutUrl: z.string().url(),
  checkoutId: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().min(1),
  referenceCode: z.string().min(1),
});

export const RazorpayCallbackSchema = z.object({
  referenceCode: z.string().min(1),
  status: z.enum(["SUCCESS", "FAILED"]),
  paymentId: z.string().optional(),
});

export const DodoPayCallbackSchema = z.object({
  referenceCode: z.string().min(1),
  status: z.enum(["SUCCESS", "FAILED"]),
  checkoutId: z.string().optional(),
});

export const RazorpayWebhookSchema = z.object({
  eventId: z.string().optional(),
  eventType: z.enum(["payment.captured", "payment.failed", "refund.processed"]),
  referenceCode: z.string().min(1),
});

export const DodoPayWebhookSchema = z.object({
  eventId: z.string().optional(),
  eventType: z.enum(["payment.captured", "payment.failed", "refund.processed"]),
  referenceCode: z.string().min(1),
});

export const MockPaymentCompleteSchema = z.object({
  orgId: z.string().min(1),
  referenceCode: z.string().min(1),
  gateway: PaymentGatewaySchema,
  status: z.enum(["SUCCESS", "FAILED"]),
});

export type CreatePaymentOrderRequest = z.infer<
  typeof CreatePaymentOrderRequestSchema
>;
