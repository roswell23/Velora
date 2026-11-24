import prisma from "../../utils/prisma.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { signToken } from "../../utils/jwt.js";
import { generateResetToken, hashToken } from "../../utils/token.js";
import { sendPasswordResetEmail } from "../../utils/email.js";
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

/**
 * AUTH-01: Register a new customer account.
 */
export async function register({ name, email, password, phone, address }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("An account with that email already exists.");
    err.statusCode = 409;
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email, passwordHash, role: "CUSTOMER" },
      select: USER_SELECT,
    });
    // Create linked Customer record
    await tx.customer.create({
      data: {
        userId: newUser.id,
        name,
        phone,
        email,
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
 */
export async function forgotPassword({ email }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.isActive) {
    const { token, tokenHash } = generateResetToken();
    const expiresAt = new Date(Date.now() + env.RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    // Fire-and-forget — do not await so response time is not affected by SMTP
    sendPasswordResetEmail(email, token, user.role).catch((err) => {
      console.error("[Email] Failed to send reset email:", err.message);
    });
  }

  return { message: GENERIC_RESET_MSG };
}

/**
 * AUTH-07: Reset password with valid, unexpired, single-use token.
 */
export async function resetPassword({ token, newPassword }) {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  const INVALID_ERR = (() => {
    const e = new Error("This password reset link is invalid, expired, or has already been used.");
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
