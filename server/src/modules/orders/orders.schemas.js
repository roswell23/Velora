import { z } from "zod";

export const orderQuerySchema = z.object({
  status: z.enum(["PENDING", "FULFILLED", "CANCELLED"]).optional(),
  source: z.enum(["ONLINE", "INTERNAL"]).optional(),
  paymentStatus: z.enum(["UNPAID", "PAID"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createWalkInOrderSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  deliveryAddress: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive().max(100),
      })
    )
    .min(1),
});

export const orderIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
