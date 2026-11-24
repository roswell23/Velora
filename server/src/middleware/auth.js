import { verifyToken } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";
import prisma from "../utils/prisma.js";

/**
 * Authenticates the request by validating the Bearer JWT.
 * Sets req.user = { id, email, role } on success.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "UNAUTHORIZED", "Authentication token required.");
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return sendError(res, 401, "INVALID_TOKEN", "Token is invalid or has expired.");
  }

  // Confirm user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return sendError(res, 403, "ACCOUNT_DEACTIVATED", "This account has been deactivated.");
  }

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
}
