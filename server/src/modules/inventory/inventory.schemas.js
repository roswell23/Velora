import { z } from "zod";

export const stockInSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().max(10000),
  unitCost: z.coerce.number().positive(),
  supplierName: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const adjustStockSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().refine((v) => v !== 0, "Adjustment quantity cannot be 0."),
  reason: z.string().trim().min(1).max(500),
});

export const movementQuerySchema = z.object({
  productId: z.coerce.number().int().positive().optional(),
  type: z.enum(["SALE", "STOCK_IN", "ADJUSTMENT", "RETURN"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
