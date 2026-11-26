import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate, validateParams, validateQuery } from "../../middleware/validate.js";
import { ROLES, STAFF_ROLES } from "../../config/permissions.js";
import {
  createCustomerSchema,
  customerIdParamSchema,
  customerQuerySchema,
  updateCustomerSchema,
} from "./customers.schemas.js";
import {
  createCustomerHandler,
  listCustomersHandler,
  updateCustomerHandler,
} from "./customers.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", requireRole(...STAFF_ROLES), validateQuery(customerQuerySchema), listCustomersHandler);
router.post("/", requireRole(ROLES.ADMIN, ROLES.SALES), validate(createCustomerSchema), createCustomerHandler);
router.put(
  "/:id",
  requireRole(ROLES.ADMIN, ROLES.SALES),
  validateParams(customerIdParamSchema),
  validate(updateCustomerSchema),
  updateCustomerHandler
);

export default router;
