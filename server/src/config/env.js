import dotenv from "dotenv";
dotenv.config({ path: new URL("../../.env", import.meta.url) });

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  DIRECT_URL: process.env.DIRECT_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev-jwt-secret-replace-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
  CUSTOMER_ORIGIN: process.env.CUSTOMER_ORIGIN || "http://localhost:5173",
  ADMIN_ORIGIN: process.env.ADMIN_ORIGIN || "http://localhost:5174",
  ARGON2_MEMORY_COST: parseInt(process.env.ARGON2_MEMORY_COST || "19456", 10),
  ARGON2_TIME_COST: parseInt(process.env.ARGON2_TIME_COST || "2", 10),
  ARGON2_PARALLELISM: parseInt(process.env.ARGON2_PARALLELISM || "1", 10),
  RESET_TOKEN_TTL_MINUTES: parseInt(process.env.RESET_TOKEN_TTL_MINUTES || "30", 10),
  BREVO_API_KEY: process.env.BREVO_API_KEY || "",
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || "",
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || "VÉLORA",
  EMAIL_FROM: process.env.EMAIL_FROM || "VÉLORA <no-reply@velora.local>",
};
