import { z } from 'zod';

export const stockInSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unitCost: z.number().positive(),
  supplierName: z.string().min(1).max(200),
  notes: z.string().max(500).optional(),
});

export const adjustStockSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int(), // positive = add, negative = remove
  reason: z.string().min(1).max(500),
});

export const movementQuerySchema = z.object({
  productId: z.string().optional(),
  type: z
    .enum(['SALE', 'STOCK_IN', 'ADJUSTMENT', 'RETURN'])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
