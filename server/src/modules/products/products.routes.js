import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { ROLES } from "../../config/permissions.js";
import { validate, validateParams, validateQuery } from "../../middleware/validate.js";
import { productIdParamSchema, productQuerySchema, updateProductSchema } from "./products.schemas.js";
import { getProductHandler, listProductsHandler, updateProductHandler } from "./products.controller.js";

const router = Router();

router.get("/", validateQuery(productQuerySchema), listProductsHandler);
router.get("/:id", validateParams(productIdParamSchema), getProductHandler);
router.put(
  "/:id",
  authenticate,
  requireRole(ROLES.ADMIN, ROLES.INVENTORY),
  validateParams(productIdParamSchema),
  validate(updateProductSchema),
  updateProductHandler
);

export default router;
