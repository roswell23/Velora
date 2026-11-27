import { z } from "zod";

export const recordPaymentSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter an amount with up to 2 decimal places."),
  method: z.enum(["CASH", "BANK_TRANSFER", "OTHER"]),
  referenceNo: z.string().trim().max(100).optional(),
});
