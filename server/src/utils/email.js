import { env } from "../config/env.js";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function getSender() {
  if (env.BREVO_SENDER_EMAIL) {
    return {
      name: (env.BREVO_SENDER_NAME || "VÉLORA").trim(),
      email: env.BREVO_SENDER_EMAIL.trim(),
    };
  }
  const error = new Error("BREVO_SENDER_EMAIL is missing. Set it to a sender verified in your Brevo account.");
  error.code = "BREVO_SENDER_NOT_CONFIGURED";
  throw error;
}

async function sendBrevoEmail({ to, subject, htmlContent, devLabel, devValue }) {
  if (!env.BREVO_API_KEY) {
    console.log(`[Email][Dev] ${devLabel} for ${to}: ${devValue}`);
    return;
  }

  let response;
  try {
    response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY.trim(),
      },
      body: JSON.stringify({
        sender: getSender(),
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new Error(`Could not reach Brevo to send ${devLabel.toLowerCase()}: ${error.message}`);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const hint = response.status === 401 || response.status === 403
      ? " Check that BREVO_API_KEY is an active Brevo API v3 key."
      : response.status === 400
        ? " Check that BREVO_SENDER_EMAIL is verified in Brevo and the recipient address is valid."
        : "";
    throw new Error(
      `Brevo email failed (${response.status}): ${errorBody || response.statusText}.${hint}`
    );
  }
}

function buildCodeEmailHtml({ heading, intro, code, expiryNote }) {
  return `
    <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #F7F6F2; color: #242620;">
      <h1 style="font-size: 24px; letter-spacing: 4px; color: #242620; margin: 0 0 6px;">VÉLORA</h1>
      <p style="color: #8D7950; font-size: 11px; letter-spacing: 2px; margin: 0 0 28px;">THE ESSENCE OF ELEGANCE</p>
      <h2 style="font-size: 19px; font-weight: 400; color: #242620; margin: 0 0 12px;">${heading}</h2>
      <p style="color: #55574F; font-size: 14px; line-height: 1.65; margin: 0 0 22px;">${intro}</p>
      <div style="margin: 24px 0; padding: 18px 24px; background: #292C27; color: #F5F2E9; text-align: center; letter-spacing: 8px; font-size: 28px; font-family: monospace;">
        ${code}
      </div>
      <p style="color: #777970; font-size: 12px; margin: 0;">${expiryNote}</p>
      <p style="color: #777970; font-size: 11px; margin-top: 28px; border-top: 1px solid #DEDDD5; padding-top: 16px;">
        © VÉLORA. All rights reserved.
      </p>
    </div>
  `;
}

/**
 * Send a 6-digit email verification code for customer registration via Brevo.
 * @param {string} toEmail
 * @param {string} code
 */
export async function sendVerificationCodeEmail(toEmail, code) {
  await sendBrevoEmail({
    to: toEmail,
    subject: "VÉLORA — Verify Your Email Address",
    htmlContent: buildCodeEmailHtml({
      heading: "Confirm your email address",
      intro:
        "Enter the 6-digit verification code below to complete your VÉLORA account registration.",
      code,
      expiryNote: "This code expires in 10 minutes and can only be used once.",
    }),
    devLabel: "Verification code",
    devValue: code,
  });
}

/**
 * Send a password reset email via Brevo.
 * Customers receive a 6-digit code; staff roles receive a reset link.
 *
 * @param {string} toEmail
 * @param {string} resetTokenOrCode — raw 6-digit code (CUSTOMER) or raw token (staff)
 * @param {string} role             — 'CUSTOMER' | staff role
 */
export async function sendPasswordResetEmail(toEmail, resetTokenOrCode, role) {
  if (role === "CUSTOMER") {
    await sendBrevoEmail({
      to: toEmail,
      subject: "VÉLORA — Your Password Reset Code",
      htmlContent: buildCodeEmailHtml({
        heading: "Password Reset Code",
        intro:
          "Use the 6-digit code below to reset your VÉLORA password. If you did not request this, you can safely ignore this email.",
        code: resetTokenOrCode,
        expiryNote: `This code expires in ${env.RESET_TOKEN_TTL_MINUTES} minutes and can only be used once.`,
      }),
      devLabel: "Password reset code",
      devValue: resetTokenOrCode,
    });
    return;
  }

  const resetUrl = `${env.ADMIN_ORIGIN}/reset-password?token=${resetTokenOrCode}`;

  await sendBrevoEmail({
    to: toEmail,
    subject: "VÉLORA — Reset Your Password",
    htmlContent: `
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
    devLabel: "Staff reset URL",
    devValue: resetUrl,
  });
}
