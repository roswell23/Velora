import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { api } from "../services/apiClient.js";

export default function WalkInOrderModal({ open, onClose, customers, products, onCreated }) {
  const [customerId, setCustomerId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [lines, setLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availableProducts = useMemo(
    () => products.filter((p) => p.isActive !== false && p.stock > 0),
    [products]
  );

  useEffect(() => {
    if (!open) return undefined;
    setCustomerId(customers[0] ? String(customers[0].id) : "");
    setDeliveryAddress("");
    setSelectedProductId(availableProducts[0] ? String(availableProducts[0].id) : "");
    setLines([]);
    setError("");
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, customers, availableProducts, onClose]);

  const orderTotal = useMemo(
    () => lines.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0),
    [lines]
  );

  if (!open) return null;

  function handleAddLine() {
    const prod = availableProducts.find((p) => String(p.id) === selectedProductId);
    if (!prod) return;
    setError("");
    setLines((current) => {
      const existing = current.find((item) => item.productId === prod.id);
      if (existing) {
        return current.map((item) =>
          item.productId === prod.id
            ? { ...item, quantity: Math.min(prod.stock, item.quantity + 1) }
            : item
        );
      }
      return [
        ...current,
        {
          productId: prod.id,
          name: prod.name,
          unitPrice: prod.unitPrice,
          stock: prod.stock,
          quantity: 1,
        },
      ];
    });
  }

  function adjustLine(productId, delta) {
    setLines((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(item.stock, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!customerId) {
      setError("Select a customer first.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one fragrance to the order.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await api.post("/orders", {
        customerId: Number(customerId),
        deliveryAddress: deliveryAddress.trim() || undefined,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      });
      onCreated(response.data);
      onClose();
    } catch (err) {
      setError(err.message || "Could not create walk-in order.");
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
        className="erp-modal erp-modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="walkin-order-title"
      >
        <div className="erp-modal-header">
          <div>
            <p className="panel-kicker">SALES ORDER · INTERNAL</p>
            <h2 id="walkin-order-title">New walk-in order</h2>
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

          <div className="erp-modal-row">
            <label>
              <span>Customer</span>
              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                required
              >
                {customers.length === 0 && <option value="">No customers yet</option>}
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Pickup / delivery address (optional)</span>
              <input
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder="Walk-in Boutique Pickup"
              />
            </label>
          </div>

          <div className="order-picker-row">
            <label className="order-picker-select">
              <span>Add fragrance</span>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
              >
                {availableProducts.length === 0 && <option value="">No in-stock fragrances</option>}
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${Number(p.unitPrice).toFixed(2)} ({p.stock} in stock)
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="outline-button"
              onClick={handleAddLine}
              disabled={!availableProducts.length}
            >
              <Plus size={14} aria-hidden="true" />
              <span>Add item</span>
            </button>
          </div>

          {lines.length > 0 && (
            <div className="order-lines-list">
              {lines.map((line) => (
                <div className="order-line-item" key={line.productId}>
                  <div>
                    <strong>{line.name}</strong>
                    <span>
                      ${Number(line.unitPrice).toFixed(2)} each · {line.stock} available
                    </span>
                  </div>
                  <div className="order-line-controls">
                    <button
                      type="button"
                      className="quiet-button"
                      onClick={() => adjustLine(line.productId, -1)}
                      aria-label={`Decrease ${line.name}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      className="quiet-button"
                      disabled={line.quantity >= line.stock}
                      onClick={() => adjustLine(line.productId, 1)}
                      aria-label={`Increase ${line.name}`}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      className="quiet-button"
                      onClick={() => adjustLine(line.productId, -line.quantity)}
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="order-lines-total">
                <span>Order total (COD)</span>
                <strong>${orderTotal.toFixed(2)}</strong>
              </div>
            </div>
          )}

          <div className="erp-modal-actions">
            <button type="button" className="outline-button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting || !customers.length || !lines.length}
            >
              <ShoppingBag size={15} aria-hidden="true" />
              <span>{submitting ? "Creating order…" : "Place walk-in order"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
