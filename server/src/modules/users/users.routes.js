import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import { listUsersHandler, createUserHandler, updateUserHandler } from "./users.controller.js";
import { createUserSchema, updateUserSchema } from "./users.schemas.js";

const router = Router();

// All user management requires authentication + ADMIN role (ADM-01, ADM-02, ADM-03)
router.use(authenticate, requireRole("ADMIN"));

router.get("/", listUsersHandler);
router.post("/", validate(createUserSchema), createUserHandler);
router.patch("/:id", validate(updateUserSchema), updateUserHandler);

export default router;
