import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";
import AuthLayout from "./AuthLayout.jsx";
import { validateForgotPasswordForm } from "./authValidation.js";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const errors = validateForgotPasswordForm({ email });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError("");
    setStatusMessage("");

    try {
      const normalizedEmail = email.trim();
      const res = await forgotPassword(normalizedEmail);
      setStatusMessage(
        res.data?.message || "If that email is registered, a 6-digit reset code has been sent."
      );
      setTimeout(() => {
        navigate("/reset-password", { state: { email: normalizedEmail } });
      }, 900);
    } catch (err) {
      setFormError(err.message || "Unable to process request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="PASSWORD RECOVERY"
      title="Reset your"
      titleEmphasis="password."
      subtitle="Enter your email address and we will send a 6-digit verification code if your account is registered."
      footerPrompt="Remembered your password?"
      footerLinkText="Back to sign in"
      footerLinkTo="/login"
    >
      {formError && (
        <div className="auth-banner auth-banner-error" role="alert">
          {formError}
        </div>
      )}

      {statusMessage && (
        <div className="auth-banner auth-banner-success" role="status">
          <CheckCircle2 size={16} />
          <span>{statusMessage}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="forgot-email">Email address</label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (fieldErrors.email) setFieldErrors({});
              if (formError) setFormError("");
            }}
            disabled={submitting}
            placeholder="you@example.com"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "forgot-email-error" : undefined}
          />
          {fieldErrors.email && (
            <p id="forgot-email-error" className="auth-field-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <button type="submit" className="button button-dark auth-submit" disabled={submitting}>
          {submitting ? (
            "Sending code…"
          ) : (
            <>
              Send reset code <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
