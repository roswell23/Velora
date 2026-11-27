import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PackagePlus, X } from "lucide-react";
import { api } from "../services/apiClient.js";

export default function StockInModal({
  open,
  onClose,
  products,
  initialProductId = null,
  onRestocked,
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const defaultId = initialProductId || products[0]?.id || "";
    setProductId(defaultId ? String(defaultId) : "");
    setQuantity("");
    setUnitCost("");
    setSupplierName("");
    setNotes("");
    setError("");
    function onKey(event) {
      if (event.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, initialProductId]);

  useEffect(() => {
    if (open && !productId && products.length > 0) {
      setProductId(String(initialProductId || products[0].id));
    }
  }, [open, initialProductId, productId, products]);

  if (!open) return null;

  const selectedProduct = products.find((p) => String(p.id) === productId) || null;
  const qtyNum = Number(quantity);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!productId) {
      setError("Select a product to restock.");
      return;
    }
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      setError("Enter a whole number greater than 0.");
      return;
    }
    const costNum = Number(unitCost);
    if (!Number.isFinite(costNum) || costNum <= 0) {
      setError("Unit cost must be greater than 0.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await api.post("/inventory/stock-in", {
        productId: Number(productId),
        quantity: qtyNum,
        unitCost: costNum,
        supplierName: supplierName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onRestocked(response.data);
      onClose();
    } catch (err) {
      setError(err.message || "Could not record stock-in.");
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
      <div className="erp-modal" role="dialog" aria-modal="true" aria-labelledby="stockin-title">
        <div className="erp-modal-header">
          <div>
            <p className="panel-kicker">INVENTORY STOCK-IN</p>
            <h2 id="stockin-title">Add product stock</h2>
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
            <span>Fragrance</span>
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              disabled={products.length === 0}
              required
            >
              {products.length === 0 ? (
                <option value="">No products available</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — {p.stock} on hand
                  </option>
                ))
              )}
            </select>
          </label>

          {selectedProduct && (
            <div className="stockin-preview">
              <span>
                Current stock: <strong>{selectedProduct.stock}</strong> bottles
              </span>
              <span>
                After restock: {Number.isInteger(qtyNum) && qtyNum > 0 ? (
                  <strong>{selectedProduct.stock + qtyNum} bottles</strong>
                ) : (
                  <strong>Enter quantity</strong>
                )}
              </span>
            </div>
          )}

          <div className="erp-modal-row">
            <label>
              <span>Quantity to add</span>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Enter quantity"
                required
                autoFocus
              />
            </label>
            <label>
              <span>Unit cost ($)</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
                placeholder="0.00"
                required
              />
            </label>
          </div>

          <label>
            <span>Supplier name</span>
            <input
              value={supplierName}
              onChange={(event) => setSupplierName(event.target.value)}
              placeholder="Enter supplier name"
            />
          </label>

          <label>
            <span>Notes (optional)</span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Batch or delivery reference (optional)"
            />
          </label>

          <div className="erp-modal-actions">
            <button type="button" className="outline-button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting || products.length === 0}
            >
              <PackagePlus size={15} aria-hidden="true" />
              <span>{submitting ? "Updating stock…" : "Record stock-in"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
