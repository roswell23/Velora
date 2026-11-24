import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import {
  registerHandler,
  loginHandler,
  staffLoginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  getMeHandler,
} from "./auth.controller.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schemas.js";

const router = Router();

// Rate limiters (AUTH-05)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many login attempts. Please try again later." },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post("/register", validate(registerSchema), registerHandler);
router.post("/login", loginLimiter, validate(loginSchema), loginHandler);
router.post("/staff-login", loginLimiter, validate(loginSchema), staffLoginHandler);
router.post(
  "/forgot-password",
  forgotLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordHandler
);
router.post("/reset-password", validate(resetPasswordSchema), resetPasswordHandler);

// Protected routes
router.get("/me", authenticate, getMeHandler);

export default router;
