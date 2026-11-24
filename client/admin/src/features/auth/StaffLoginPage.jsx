import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";

export default function StaffLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(form.email, form.password);
      // Redirect to the first department the user has access to
      if (user.role === "ADMIN" || user.role === "SALES") navigate("/sales");
      else if (user.role === "INVENTORY") navigate("/inventory");
      else if (user.role === "FINANCE") navigate("/finance");
      else navigate("/");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <section className="login-panel">
        <div className="login-inner">
          <a className="login-brand" href="/">
            <span className="brand-symbol">
              <Sparkles size={17} strokeWidth={1.4} />
            </span>
            <span>
              <strong>VÉLORA</strong>
              <small>OPERATIONS</small>
            </span>
          </a>
          <div className="login-heading">
            <p>YOUR WORKSPACE AWAITS</p>
            <h1>
              Good to have
              <br />
              you back.
            </h1>
            <span>Sign in to continue where your team left off.</span>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              Work email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@velora.local"
              />
            </label>
            <label>
              Password
              <span className="password-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                "Signing in…"
              ) : (
                <>
                  Sign in to workspace <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
          <p className="login-footnote">
            <ShieldCheck size={15} /> Staff access only. Customer accounts sign in through the
            Vélora boutique.
          </p>
        </div>
      </section>
      <aside className="login-art" aria-label="Vélora fragrance atelier">
        <img
          src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1800&q=90"
          alt="Warm sunlight falling across a fragrance atelier"
        />
        <div className="login-art-caption">
          <span>VÉLORA · OPERATIONS</span>
          <h2>Every detail, in its right place.</h2>
          <p>One thoughtful workspace for the people behind the fragrance.</p>
          <small>THE ESSENCE OF ELEGANCE</small>
        </div>
      </aside>
    </div>
  );
}
