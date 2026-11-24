import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Sign a JWT for the given user.
 * @param {{ id: number, email: string, role: string }} user
 * @returns {string} signed token
 */
export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verify a JWT and return the payload, or null if invalid.
 * @param {string} token
 * @returns {object|null}
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
}
