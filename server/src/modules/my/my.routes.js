import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import { createOrderHandler, getProfileHandler } from "./my.controller.js";
import { createOnlineOrderSchema } from "./my.schemas.js";

const router = Router();

router.use(authenticate, requireRole("CUSTOMER"));
router.get("/profile", getProfileHandler);
router.post("/orders", validate(createOnlineOrderSchema), createOrderHandler);

export default router;
