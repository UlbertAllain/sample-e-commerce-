import { z } from "zod";

export const createOrderSchema = z.object({
  items: z.array(z.object({ productId: z.string().min(1), variantId: z.string().trim().min(1).max(80).optional(), quantity: z.coerce.number().int().min(1).max(999) })).min(1).max(50),
  shippingId: z.string().min(1),
  paymentMethod: z.enum(["bank-transfer", "qris", "cod"]),
  voucherCode: z.string().trim().max(30).optional(),
  note: z.string().trim().max(500).optional(),
});

export const updateOrderSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "failed", "expired", "refunded"]).optional(),
  shipmentStatus: z.enum(["waiting-payment", "processing", "packed", "picked-up", "in-transit", "delivered", "cancelled"]).optional(),
  trackingNumber: z.string().trim().min(3).max(100).optional(),
  internalNote: z.string().trim().max(1000).optional(),
});
