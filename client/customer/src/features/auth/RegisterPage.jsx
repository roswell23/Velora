import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, RotateCw } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";
import AuthLayout from "./AuthLayout.jsx";
import {
  mapServerFieldErrors,
  validateOtpCode,
  validateRegisterForm,
} from "./authValidation.js";

export default function RegisterPage() {
  const { sendRegisterCode, register } = useAuth();
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);

  const [step, setStep] = useState("details");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

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

  function handleCodeChange(event) {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(digitsOnly);
    if (fieldErrors.verificationCode) {
      setFieldErrors((prev) => ({ ...prev, verificationCode: "" }));
    }
    if (formError) setFormError("");
  }

  async function handleSendCode(event) {
    event.preventDefault();
    if (submitting || successMessage) return;

    const errors = validateRegisterForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please review the highlighted fields before continuing.");
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError("");
    setInfoMessage("");

    try {
      const normalizedEmail = form.email.trim();
      await sendRegisterCode(normalizedEmail);
      setStep("verify");
      setInfoMessage(`We sent a 6-digit verification code to ${normalizedEmail}.`);
    } catch (err) {
      const serverFields = mapServerFieldErrors(err.details);
      if (Object.keys(serverFields).length > 0) {
        setFieldErrors(serverFields);
      }
      setFormError(err.message || "Unable to send verification code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (resending || submitting || successMessage) return;
    setResending(true);
    setFormError("");
    setInfoMessage("");

    try {
      const normalizedEmail = form.email.trim();
      await sendRegisterCode(normalizedEmail);
      setInfoMessage(`A new 6-digit verification code was sent to ${normalizedEmail}.`);
    } catch (err) {
      setFormError(err.message || "Unable to resend verification code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleVerifyAndRegister(event) {
    event.preventDefault();
    if (submitting || successMessage) return;

    const codeError = validateOtpCode(verificationCode);
    if (codeError) {
      setFieldErrors({ verificationCode: codeError });
      setFormError("Please enter the 6-digit code sent to your email.");
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
      verificationCode: verificationCode.trim(),
    };

    const trimmedAddress = form.address.trim();
    if (trimmedAddress) {
      payload.address = trimmedAddress;
    }

    try {
      const user = await register(payload);
      setInfoMessage("");
      setSuccessMessage(`Welcome to Vélora, ${user.name}. Taking you to the boutique…`);
      redirectTimerRef.current = setTimeout(() => {
        navigate("/", { replace: true });
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
      eyebrow={step === "details" ? "CREATE ACCOUNT" : "VERIFY YOUR EMAIL"}
      title={step === "details" ? "Join the" : "Check your"}
      titleEmphasis={step === "details" ? "atelier." : "inbox."}
      subtitle={
        step === "details"
          ? "Create your personal Vélora profile for effortless browsing and future orders."
          : "Enter the 6-digit code we sent to confirm your email address."
      }
      footerPrompt="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
    >
      {formError && (
        <div className="auth-banner auth-banner-error" role="alert">
          {formError}
        </div>
      )}

      {infoMessage && !successMessage && (
        <div className="auth-banner auth-banner-info" role="status">
          <span>{infoMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="auth-banner auth-banner-success" role="status">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {step === "details" ? (
        <form className="auth-form" onSubmit={handleSendCode} noValidate>
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
              "Sending verification code…"
            ) : (
              <>
                Send verification code <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleVerifyAndRegister} noValidate>
          <div className="auth-field">
            <label htmlFor="register-code">6-digit verification code</label>
            <input
              id="register-code"
              name="verificationCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="auth-otp-input"
              value={verificationCode}
              onChange={handleCodeChange}
              disabled={isLocked}
              placeholder="000000"
              aria-invalid={Boolean(fieldErrors.verificationCode)}
              aria-describedby={
                fieldErrors.verificationCode ? "register-code-error" : "register-code-hint"
              }
            />
            {fieldErrors.verificationCode ? (
              <p id="register-code-error" className="auth-field-error">
                {fieldErrors.verificationCode}
              </p>
            ) : (
              <p id="register-code-hint" className="auth-field-hint">
                Code expires in 10 minutes.
              </p>
            )}
          </div>

          <button type="submit" className="button button-dark auth-submit" disabled={isLocked}>
            {submitting ? (
              "Verifying & creating account…"
            ) : (
              <>
                Verify &amp; create account <ArrowRight size={15} />
              </>
            )}
          </button>

          <div className="auth-secondary-actions">
            <button
              type="button"
              className="auth-text-btn"
              onClick={() => {
                setStep("details");
                setFormError("");
                setInfoMessage("");
              }}
              disabled={isLocked}
            >
              <ArrowLeft size={13} /> Edit details
            </button>
            <button
              type="button"
              className="auth-text-btn"
              onClick={handleResendCode}
              disabled={isLocked || resending}
            >
              <RotateCw size={13} /> {resending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
