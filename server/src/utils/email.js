import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * Create a transporter — Ethereal (dev) or real SMTP (prod).
 * @returns {Promise<nodemailer.Transporter>}
 */
async function createTransporter() {
  if (!env.SMTP_HOST) {
    // Ethereal test inbox — no config required
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

/**
 * Send a password reset email.
 * In development, prints the Ethereal preview URL to console.
 *
 * @param {string} toEmail
 * @param {string} resetToken  — the raw token (NOT the hash)
 * @param {string} role        — 'CUSTOMER' | staff role
 */
export async function sendPasswordResetEmail(toEmail, resetToken, role) {
  const baseUrl = role === "CUSTOMER" ? env.CUSTOMER_ORIGIN : env.ADMIN_ORIGIN;
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const transporter = await createTransporter();

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: toEmail,
    subject: "VÉLORA — Reset Your Password",
    html: `
      <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #F8F6F0;">
        <h1 style="font-size: 24px; color: #171717; margin-bottom: 8px;">VÉLORA</h1>
        <p style="color: #888888; font-size: 12px; letter-spacing: 2px; margin-bottom: 32px;">THE ESSENCE OF ELEGANCE</p>
        <h2 style="font-size: 18px; color: #292929;">Password Reset Request</h2>
        <p style="color: #292929; line-height: 1.6;">
          You requested a password reset. Click the button below within 30 minutes to set a new password.
          If you did not request this, you can safely ignore this email.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #171717;
                  color: #D9BD83; font-family: Georgia, serif; text-decoration: none; border-radius: 2px;">
          Reset Password
        </a>
        <p style="color: #888888; font-size: 12px;">This link expires in 30 minutes and can only be used once.</p>
        <p style="color: #888888; font-size: 12px; margin-top: 32px; border-top: 1px solid #D9BD83; padding-top: 16px;">
          © VÉLORA. All rights reserved.
        </p>
      </div>
    `,
  });

  if (!env.SMTP_HOST) {
    console.log(`[Email] Password reset preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
