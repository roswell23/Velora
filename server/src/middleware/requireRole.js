import { sendError } from "../utils/response.js";

/**
 * Role authorization middleware factory.
 * Usage: router.get("/route", authenticate, requireRole("ADMIN", "SALES"), controller)
 *
 * @param {...string} allowedRoles
 * @returns {import("express").RequestHandler}
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required.");
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, "FORBIDDEN", "You do not have permission to perform this action.");
    }
    next();
  };
}
