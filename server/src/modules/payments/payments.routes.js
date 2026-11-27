import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { ROLES } from "../../config/permissions.js";
import { validate } from "../../middleware/validate.js";
import { recordPaymentSchema } from "./payments.schemas.js";
import { recordPaymentHandler } from "./payments.controller.js";

const router = Router();

router.use(authenticate);
router.post(
  "/",
  requireRole(ROLES.ADMIN, ROLES.FINANCE),
  validate(recordPaymentSchema),
  recordPaymentHandler
);

export default router;
