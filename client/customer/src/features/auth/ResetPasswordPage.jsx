import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";
import AuthLayout from "./AuthLayout.jsx";
import { mapServerFieldErrors, validateResetPasswordForm } from "./authValidation.js";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);

  const [form, setForm] = useState({
    email: location.state?.email || "",
    code: "",
    newPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    const nextValue = name === "code" ? value.replace(/\D/g, "").slice(0, 6) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (formError) setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || successMessage) return;

    const errors = validateResetPasswordForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please review the highlighted fields before continuing.");
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError("");

    try {
      const res = await resetPassword({
        email: form.email.trim(),
        code: form.code.trim(),
        newPassword: form.newPassword,
      });
      setSuccessMessage(
        res.data?.message || "Your password has been reset. Redirecting to sign in…"
      );
      redirectTimerRef.current = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (err) {
      const serverFields = mapServerFieldErrors(err.details);
      if (Object.keys(serverFields).length > 0) {
        setFieldErrors(serverFields);
      }
      setFormError(err.message || "Unable to reset password. Please check your code.");
    } finally {
      setSubmitting(false);
    }
  }

  const isLocked = submitting || Boolean(successMessage);

  return (
    <AuthLayout
      eyebrow="NEW PASSWORD"
      title="Enter your"
      titleEmphasis="reset code."
      subtitle="Enter the 6-digit code sent to your email along with your new password."
      footerPrompt="Need a new code?"
      footerLinkText="Request another code"
      footerLinkTo="/forgot-password"
    >
      {formError && (
        <div className="auth-banner auth-banner-error" role="alert">
          {formError}
        </div>
      )}

      {successMessage && (
        <div className="auth-banner auth-banner-success" role="status">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="reset-email">Email address</label>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            disabled={isLocked}
            placeholder="you@example.com"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "reset-email-error" : undefined}
          />
          {fieldErrors.email && (
            <p id="reset-email-error" className="auth-field-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="reset-code">6-digit reset code</label>
          <input
            id="reset-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="auth-otp-input"
            value={form.code}
            onChange={handleChange}
            disabled={isLocked}
            placeholder="000000"
            aria-invalid={Boolean(fieldErrors.code)}
            aria-describedby={fieldErrors.code ? "reset-code-error" : undefined}
          />
          {fieldErrors.code && (
            <p id="reset-code-error" className="auth-field-error">
              {fieldErrors.code}
            </p>
          )}
        </div>

        <div className="auth-field">
          <div className="auth-field-row">
            <label htmlFor="reset-password">New password</label>
            <Link className="auth-inline-link" to="/login">
              Back to sign in
            </Link>
          </div>
          <div className="auth-password-wrap">
            <input
              id="reset-password"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.newPassword}
              onChange={handleChange}
              disabled={isLocked}
              placeholder="Minimum 8 characters"
              aria-invalid={Boolean(fieldErrors.newPassword)}
              aria-describedby={
                fieldErrors.newPassword ? "reset-password-error" : "reset-password-hint"
              }
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isLocked}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.newPassword ? (
            <p id="reset-password-error" className="auth-field-error">
              {fieldErrors.newPassword}
            </p>
          ) : (
            <p id="reset-password-hint" className="auth-field-hint">
              Must be at least 8 characters.
            </p>
          )}
        </div>

        <button type="submit" className="button button-dark auth-submit" disabled={isLocked}>
          {submitting ? (
            "Resetting password…"
          ) : (
            <>
              Reset password <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
