import argon2 from "argon2";
import { env } from "../config/env.js";

const OPTIONS = {
  memoryCost: env.ARGON2_MEMORY_COST,
  timeCost: env.ARGON2_TIME_COST,
  parallelism: env.ARGON2_PARALLELISM,
};

/**
 * Hash a plain-text password with Argon2id.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return argon2.hash(password, OPTIONS);
}

/**
 * Verify a plain-text password against an Argon2id hash.
 * @param {string} hash
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}
