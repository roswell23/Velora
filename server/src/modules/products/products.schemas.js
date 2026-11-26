import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  brand: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  size: z.string().max(50).optional(),
  unitPrice: z.number().positive(),
  stock: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(10),
  categoryId: z.string().cuid(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  brand: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  size: z.string().max(50).optional(),
  unitPrice: z.number().positive().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
  categoryId: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
});

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const productQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === 'false' ? false : v === 'true' ? true : undefined)),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
