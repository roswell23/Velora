import crypto from "crypto";

/**
 * Generate a secure random reset token and its SHA-256 hash.
 * @returns {{ token: string, tokenHash: string }}
 */
export function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

/**
 * Hash a plain token for database lookup.
 * @param {string} token
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
