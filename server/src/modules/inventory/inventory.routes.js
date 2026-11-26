import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate, validateQuery } from "../../middleware/validate.js";
import { ROLES } from "../../config/permissions.js";
import { movementQuerySchema, stockInSchema } from "./inventory.schemas.js";
import { listMovementsHandler, stockInHandler } from "./inventory.controller.js";

const router = Router();

router.use(authenticate);

router.post("/stock-in", requireRole(ROLES.ADMIN, ROLES.INVENTORY), validate(stockInSchema), stockInHandler);
router.get(
  "/movements",
  requireRole(ROLES.ADMIN, ROLES.INVENTORY, ROLES.FINANCE),
  validateQuery(movementQuerySchema),
  listMovementsHandler
);

export default router;
