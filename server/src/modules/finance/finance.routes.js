import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { ROLES } from "../../config/permissions.js";
import { dashboardHandler } from "./finance.controller.js";

const router = Router();

router.use(authenticate);
router.get("/dashboard", requireRole(ROLES.ADMIN, ROLES.FINANCE), dashboardHandler);

export default router;
