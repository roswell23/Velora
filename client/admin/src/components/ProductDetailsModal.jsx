import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Package, X } from "lucide-react";
import { api } from "../services/apiClient.js";

export default function ProductDetailsModal({ product, canEdit = false, onClose, onUpdated }) {
  const [unitPrice, setUnitPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!product) return;
    setUnitPrice(String(product.unitPrice));
    setError("");
  }, [product]);

  if (!product) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const price = Number(unitPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a selling price greater than 0.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await api.put(`/products/${product.id}`, { unitPrice: price });
      onUpdated(response.data);
      onClose();
    } catch (err) {
      setError(err.message || "Could not update the selling price.");
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div
      className="erp-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="erp-modal" role="dialog" aria-modal="true" aria-labelledby="product-title">
        <div className="erp-modal-header">
          <div>
            <p className="panel-kicker">PRODUCT DETAILS</p>
            <h2 id="product-title">{product.name}</h2>
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
          <div className="product-detail-summary">
            <span className="table-mark"><Package size={16} /></span>
            <div>
              <strong>{product.brand || product.name}</strong>
              <span>{product.category?.name || "Uncategorized"} · {product.size || "Size not set"}</span>
            </div>
          </div>
          <div className="product-detail-grid">
            <span>SKU</span><strong>{product.sku}</strong>
            <span>Stock on hand</span><strong>{product.stock} bottles</strong>
            <span>Reorder level</span><strong>{product.reorderLevel} bottles</strong>
          </div>
          {canEdit ? (
            <label>
              <span>Selling price ($)</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
                required
              />
              <small className="stockin-cost-note">
                Changing this price won’t alter unit costs or prices on existing orders.
              </small>
            </label>
          ) : (
            <div className="product-detail-grid">
              <span>Selling price</span>
              <strong>${Number(product.unitPrice).toFixed(2)}</strong>
            </div>
          )}
          <div className="erp-modal-actions">
            <button type="button" className="outline-button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            {canEdit && (
              <button type="submit" className="primary-button" disabled={submitting}>
                {submitting ? "Saving…" : "Save selling price"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
