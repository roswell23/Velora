import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().max(99),
});

export const createOnlineOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(30).superRefine((items, context) => {
    const ids = items.map((item) => item.productId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each product can only appear once in the order.",
      });
    }
  }),
  deliveryAddress: z.string().trim().min(5).max(500),
  phone: z.string().trim().min(7).max(30),
});
