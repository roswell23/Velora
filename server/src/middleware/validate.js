import { sendError } from "../utils/response.js";

/**
 * Zod schema validation middleware factory.
 * Usage: router.post("/route", validate(myZodSchema), controller)
 *
 * @param {import("zod").ZodSchema} schema  Zod schema to validate req.body against
 * @returns {import("express").RequestHandler}
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join("."),
        issue: e.message,
      }));
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid request data.", details);
    }
    req.body = result.data;
    next();
  };
}

/**
 * Zod query param validation middleware factory.
 * @param {import("zod").ZodSchema} schema
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join("."),
        issue: e.message,
      }));
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid query parameters.", details);
    }
    req.query = result.data;
    next();
  };
}

/**
 * Zod route param validation middleware factory.
 * @param {import("zod").ZodSchema} schema
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join("."),
        issue: e.message,
      }));
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid route parameters.", details);
    }
    req.params = result.data;
    next();
  };
}
