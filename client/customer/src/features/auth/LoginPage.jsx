import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";
import AuthLayout from "./AuthLayout.jsx";
import { mapServerFieldErrors, validateLoginForm } from "./authValidation.js";

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);

  const [form, setForm] = useState({ email: "", password: "" });
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
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (formError) setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || successMessage) return;

    const errors = validateLoginForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please check the highlighted fields before continuing.");
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError("");

    try {
      const user = await login(form.email.trim(), form.password);
      setSuccessMessage(`Welcome back, ${user.name}. Redirecting to the boutique…`);
      redirectTimerRef.current = setTimeout(() => {
        const returnPath = location.state?.from;
        navigate(typeof returnPath === "string" && returnPath.startsWith("/") ? returnPath : "/", {
          replace: true,
        });
      }, 650);
    } catch (err) {
      const serverFields = mapServerFieldErrors(err.details);
      if (Object.keys(serverFields).length > 0) {
        setFieldErrors(serverFields);
      }
      setFormError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isLocked = submitting || Boolean(successMessage);

  return (
    <AuthLayout
      eyebrow="CLIENT SIGN IN"
      title="Welcome"
      titleEmphasis="back."
      subtitle="Enter your email and password to access your Vélora account."
      footerPrompt="New to Vélora?"
      footerLinkText="Create an account"
      footerLinkTo="/register"
      footerLinkState={location.state?.from ? { from: location.state.from } : undefined}
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
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            disabled={isLocked}
            placeholder="you@example.com"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="auth-field-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="auth-field">
          <div className="auth-field-row">
            <label htmlFor="login-password">Password</label>
            <Link className="auth-inline-link" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <div className="auth-password-wrap">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              disabled={isLocked}
              placeholder="Enter your password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
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
          {fieldErrors.password && (
            <p id="login-password-error" className="auth-field-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button type="submit" className="button button-dark auth-submit" disabled={isLocked}>
          {submitting ? (
            "Signing in…"
          ) : (
            <>
              Sign in <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
