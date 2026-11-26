import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";
import AuthLayout from "./AuthLayout.jsx";
import { mapServerFieldErrors, validateRegisterForm } from "./authValidation.js";

export default function RegisterPage() {
  const { register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
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
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (formError) setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || successMessage) return;

    const errors = validateRegisterForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please review the highlighted fields before creating your account.");
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
    };

    const trimmedAddress = form.address.trim();
    if (trimmedAddress) {
      payload.address = trimmedAddress;
    }

    try {
      const user = await register(payload);
      setSuccessMessage(`Welcome to Vélora, ${user.name}. Taking you to the boutique…`);
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
      setFormError(err.message || "Unable to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isLocked = submitting || Boolean(successMessage);

  return (
    <AuthLayout
      eyebrow="CREATE ACCOUNT"
      title="Join the"
      titleEmphasis="atelier."
      subtitle="Create your personal Vélora profile for effortless browsing and future orders."
      footerPrompt="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
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
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            disabled={isLocked}
            placeholder="Jane Doe"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "register-name-error" : undefined}
          />
          {fieldErrors.name && (
            <p id="register-name-error" className="auth-field-error">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            disabled={isLocked}
            placeholder="you@example.com"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
          />
          {fieldErrors.email && (
            <p id="register-email-error" className="auth-field-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-password">Password</label>
          <div className="auth-password-wrap">
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              disabled={isLocked}
              placeholder="Minimum 8 characters"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "register-password-error" : "register-password-hint"
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
          {fieldErrors.password ? (
            <p id="register-password-error" className="auth-field-error">
              {fieldErrors.password}
            </p>
          ) : (
            <p id="register-password-hint" className="auth-field-hint">
              Must be at least 8 characters.
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-phone">Phone number</label>
          <input
            id="register-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            disabled={isLocked}
            placeholder="+63 917 123 4567"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "register-phone-error" : undefined}
          />
          {fieldErrors.phone && (
            <p id="register-phone-error" className="auth-field-error">
              {fieldErrors.phone}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-address">
            Delivery address <span className="auth-optional">(Optional)</span>
          </label>
          <input
            id="register-address"
            name="address"
            type="text"
            autoComplete="street-address"
            value={form.address}
            onChange={handleChange}
            disabled={isLocked}
            placeholder="123 Elegance Ave, Makati City"
            aria-invalid={Boolean(fieldErrors.address)}
            aria-describedby={fieldErrors.address ? "register-address-error" : undefined}
          />
          {fieldErrors.address && (
            <p id="register-address-error" className="auth-field-error">
              {fieldErrors.address}
            </p>
          )}
        </div>

        <button type="submit" className="button button-dark auth-submit" disabled={isLocked}>
          {submitting ? (
            "Creating account…"
          ) : (
            <>
              Create account <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
