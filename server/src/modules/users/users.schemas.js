import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "SALES", "INVENTORY", "FINANCE"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["ADMIN", "SALES", "INVENTORY", "FINANCE"]).optional(),
  isActive: z.boolean().optional(),
});
