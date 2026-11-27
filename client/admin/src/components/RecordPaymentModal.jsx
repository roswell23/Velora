import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { api } from "../services/apiClient.js";

export default function RecordPaymentModal({ order, onClose, onRecorded }) {
  const [method, setMethod] = useState("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!order) return;
    setMethod("CASH");
    setReferenceNo("");
    setError("");
  }, [order]);

  if (!order) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const response = await api.post("/payments", {
        orderId: order.id,
        amount: String(order.total),
        method,
        referenceNo: referenceNo.trim() || undefined,
      });
      onRecorded(response.data);
      onClose();
    } catch (err) {
      setError(err.message || "Could not record payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="erp-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section className="erp-modal" role="dialog" aria-modal="true" aria-labelledby="payment-title">
        <div className="erp-modal-header">
          <div>
            <p className="panel-kicker">FINANCE · PAYMENT COLLECTION</p>
            <h2 id="payment-title">Record payment</h2>
          </div>
          <button
            type="button"
            className="quiet-button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form className="erp-modal-form" onSubmit={handleSubmit}>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <div className="payment-order-summary">
            <span>Order</span>
            <strong>{order.orderNumber}</strong>
            <span>Customer</span>
            <strong>{order.customer?.name || "—"}</strong>
            <span>Amount due</span>
            <strong>${Number(order.total).toFixed(2)}</strong>
          </div>
          <label>
            <span>Payment method</span>
            <select value={method} onChange={(event) => setMethod(event.target.value)}>
              <option value="CASH">Cash / COD</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>
            <span>Reference number (optional)</span>
            <input
              value={referenceNo}
              onChange={(event) => setReferenceNo(event.target.value)}
              maxLength={100}
              placeholder="Receipt or transfer reference"
            />
          </label>
          <div className="erp-modal-actions">
            <button type="button" className="outline-button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              <Check size={15} aria-hidden="true" />
              <span>{submitting ? "Recording…" : "Confirm payment"}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
