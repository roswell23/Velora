import prisma from "../../utils/prisma.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { signToken } from "../../utils/jwt.js";
import {
  generateOtpCode,
  generateResetToken,
  hashOtpCode,
  hashToken,
} from "../../utils/token.js";
import { sendPasswordResetEmail, sendVerificationCodeEmail } from "../../utils/email.js";
import { env } from "../../config/env.js";

const GENERIC_RESET_MSG =
  "If that email is registered, password reset instructions have been sent.";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
};

const REGISTRATION_CODE_TTL_MINUTES = 10;

/**
 * AUTH-01: Send a 6-digit email verification code prior to customer registration.
 */
export async function sendRegistrationCode({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const err = new Error("An account with that email already exists.");
    err.statusCode = 409;
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode("signup", normalizedEmail, code);
  const expiresAt = new Date(Date.now() + REGISTRATION_CODE_TTL_MINUTES * 60 * 1000);

  await prisma.emailVerificationCode.updateMany({
    where: { email: normalizedEmail, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.emailVerificationCode.create({
    data: { email: normalizedEmail, codeHash, expiresAt },
  });

  await sendVerificationCodeEmail(normalizedEmail, code);

  return { message: "A 6-digit verification code has been sent to your email." };
}

/**
 * AUTH-01: Verify email code and register a new customer account.
 */
export async function register({ name, email, password, phone, address, verificationCode }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const err = new Error("An account with that email already exists.");
    err.statusCode = 409;
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const codeHash = hashOtpCode("signup", normalizedEmail, verificationCode);
  const codeRecord = await prisma.emailVerificationCode.findFirst({
    where: {
      email: normalizedEmail,
      codeHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!codeRecord) {
    const err = new Error("Verification code is invalid or has expired.");
    err.statusCode = 400;
    err.code = "INVALID_OR_EXPIRED_CODE";
    throw err;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    await tx.emailVerificationCode.update({
      where: { id: codeRecord.id },
      data: { usedAt: new Date() },
    });

    const newUser = await tx.user.create({
      data: { name, email: normalizedEmail, passwordHash, role: "CUSTOMER" },
      select: USER_SELECT,
    });
    // Create linked Customer record
    await tx.customer.create({
      data: {
        userId: newUser.id,
        name,
        phone,
        email: normalizedEmail,
        address: address || null,
      },
    });
    return newUser;
  });

  const token = signToken(user);
  return { user, token };
}

/**
 * AUTH-02: Authenticate a customer. Rejects staff roles.
 */
export async function loginCustomer({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...USER_SELECT, passwordHash: true },
  });

  const GENERIC_ERR = (() => {
    const e = new Error("Invalid email or password.");
    e.statusCode = 401;
    e.code = "INVALID_CREDENTIALS";
    return e;
  })();

  if (!user) throw GENERIC_ERR;
  if (user.role !== "CUSTOMER") throw GENERIC_ERR;
  if (!user.isActive) {
    const err = new Error("This account has been deactivated.");
    err.statusCode = 403;
    err.code = "ACCOUNT_DEACTIVATED";
    throw err;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) throw GENERIC_ERR;

  const { passwordHash: _ph, ...safeUser } = user;
  const token = signToken(safeUser);
  return { user: safeUser, token };
}

/**
 * AUTH-03: Authenticate a staff member. Rejects CUSTOMER role and deactivated accounts.
 */
export async function loginStaff({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...USER_SELECT, passwordHash: true },
  });

  const GENERIC_ERR = (() => {
    const e = new Error("Invalid email or password.");
    e.statusCode = 401;
    e.code = "INVALID_CREDENTIALS";
    return e;
  })();

  if (!user) throw GENERIC_ERR;
  if (user.role === "CUSTOMER") throw GENERIC_ERR;

  if (!user.isActive) {
    const err = new Error("This account has been deactivated. Please contact your administrator.");
    err.statusCode = 403;
    err.code = "ACCOUNT_DEACTIVATED";
    throw err;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) throw GENERIC_ERR;

  const { passwordHash: _ph, ...safeUser } = user;
  const token = signToken(safeUser);
  return { user: safeUser, token };
}

/**
 * AUTH-06: Initiate password reset. Always returns generic message.
 * Customers receive a 6-digit OTP code; staff receive a reset link token.
 */
export async function forgotPassword({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user && user.isActive) {
    const isCustomer = user.role === "CUSTOMER";
    const secret = isCustomer ? generateOtpCode() : generateResetToken().token;
    const tokenHash = isCustomer
      ? hashOtpCode("reset", normalizedEmail, secret)
      : hashToken(secret);
    const expiresAt = new Date(Date.now() + env.RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    // Keep the generic response for account privacy, but wait for Brevo so a
    // rejected send is logged before the request finishes.
    try {
      await sendPasswordResetEmail(normalizedEmail, secret, user.role);
    } catch (err) {
      console.error("[Email] Failed to send reset email:", err.message);
    }
  }

  return { message: GENERIC_RESET_MSG };
}

/**
 * AUTH-07: Reset password with valid, unexpired, single-use token or customer 6-digit code.
 */
export async function resetPassword({ token, email, code, newPassword }) {
  const tokenHash = token ? hashToken(token) : hashOtpCode("reset", email, code);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  const INVALID_ERR = (() => {
    const e = new Error("This password reset code or link is invalid, expired, or has already been used.");
    e.statusCode = 400;
    e.code = "INVALID_OR_EXPIRED_TOKEN";
    return e;
  })();

  if (!record) throw INVALID_ERR;
  if (record.usedAt) throw INVALID_ERR;
  if (new Date() > record.expiresAt) throw INVALID_ERR;

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
  });

  return {
    message: "Your password has been reset successfully. Please log in with your new password.",
  };
}

/**
 * AUTH-08: Return current user identity.
 */
export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return user;
}
