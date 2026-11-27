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

/**
 * Generate a 6-digit numeric verification code.
 * @returns {string}
 */
export function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * Hash a 6-digit OTP code scoped to purpose and normalized email.
 * @param {string} purpose
 * @param {string} email
 * @param {string} code
 * @returns {string}
 */
export function hashOtpCode(purpose, email, code) {
  const normalized = `${purpose}:${email.trim().toLowerCase()}:${code.trim()}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
