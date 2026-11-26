import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { api } from "../services/apiClient.js";

const INITIAL = { name: "", phone: "", email: "", address: "" };

export default function CustomerModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    setForm(INITIAL);
    setError("");
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
    if (form.name.trim().length < 2) {
      setError("Customer name must be at least 2 characters.");
      return;
    }
    if (form.phone.trim().length < 7) {
      setError("Phone number must be at least 7 characters.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await api.post("/customers", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      });
      onCreated(response.data);
      onClose();
    } catch (err) {
      setError(err.message || "Could not create customer.");
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
      <div className="erp-modal" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
        <div className="erp-modal-header">
          <div>
            <p className="panel-kicker">CUSTOMER RECORD</p>
            <h2 id="customer-modal-title">Add walk-in customer</h2>
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
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Elena Santos"
              required
              autoFocus
            />
          </label>
          <div className="erp-modal-row">
            <label>
              <span>Phone number</span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+63 917 000 0000"
                required
              />
            </label>
            <label>
              <span>Email (optional)</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="elena@example.com"
              />
            </label>
          </div>
          <label>
            <span>Address (optional)</span>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Delivery or boutique note"
            />
          </label>
          <div className="erp-modal-actions">
            <button type="button" className="outline-button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              <UserPlus size={15} aria-hidden="true" />
              <span>{submitting ? "Saving…" : "Save customer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
