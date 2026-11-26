import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { api } from "../services/apiClient.js";

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  role: "SALES",
};

export default function StaffModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    setForm(INITIAL_FORM);
    setError("");
    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    if (trimmedName.length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid staff email address.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await api.post("/users", {
        name: trimmedName,
        email: trimmedEmail,
        password: form.password,
        role: form.role,
      });
      onCreated(response.data);
      onClose();
    } catch (err) {
      setError(err.message || "Could not create staff account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="erp-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="erp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-staff-title"
      >
        <div className="erp-modal-header">
          <div>
            <p className="panel-kicker">TEAM ACCESS</p>
            <h2 id="create-staff-title">Add staff member</h2>
          </div>
          <button type="button" className="quiet-button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form className="erp-modal-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <label>
            <span>Full name</span>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Camille Laurent"
              required
              autoFocus
            />
          </label>

          <label>
            <span>Work email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="camille@velora.local"
              required
            />
          </label>

          <div className="erp-modal-row">
            <label>
              <span>Department role</span>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="SALES">Sales</option>
                <option value="INVENTORY">Inventory</option>
                <option value="FINANCE">Finance</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </label>

            <label>
              <span>Temporary password</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </label>
          </div>

          <div className="erp-modal-actions">
            <button type="button" className="outline-button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              <UserPlus size={15} aria-hidden="true" />
              <span>{submitting ? "Creating account…" : "Create staff account"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
