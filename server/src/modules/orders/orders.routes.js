import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate, validateParams, validateQuery } from "../../middleware/validate.js";
import { ROLES, STAFF_ROLES } from "../../config/permissions.js";
import {
  createWalkInOrderSchema,
  orderIdParamSchema,
  orderQuerySchema,
} from "./orders.schemas.js";
import {
  cancelOrderHandler,
  createOrderHandler,
  fulfillOrderHandler,
  listOrdersHandler,
} from "./orders.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", requireRole(...STAFF_ROLES), validateQuery(orderQuerySchema), listOrdersHandler);
router.post(
  "/",
  requireRole(ROLES.ADMIN, ROLES.SALES),
  validate(createWalkInOrderSchema),
  createOrderHandler
);
router.post(
  "/:id/cancel",
  requireRole(ROLES.ADMIN, ROLES.SALES),
  validateParams(orderIdParamSchema),
  cancelOrderHandler
);
router.post(
  "/:id/fulfill",
  requireRole(ROLES.ADMIN, ROLES.INVENTORY),
  validateParams(orderIdParamSchema),
  fulfillOrderHandler
);

export default router;
