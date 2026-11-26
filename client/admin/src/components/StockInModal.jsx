import { useEffect, useState } from "react";
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
  const [quantity, setQuantity] = useState("10");
  const [unitCost, setUnitCost] = useState("45.00");
  const [supplierName, setSupplierName] = useState("Grasse Botanicals");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    const defaultId = initialProductId || products[0]?.id || "";
    setProductId(defaultId ? String(defaultId) : "");
    setQuantity("10");
    setUnitCost("45.00");
    setSupplierName("Grasse Botanicals");
    setNotes("");
    setError("");
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, initialProductId, products, onClose]);

  if (!open) return null;

  const selectedProduct = products.find((p) => String(p.id) === productId) || null;
  const qtyNum = Number.parseInt(quantity, 10) || 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!productId) {
      setError("Select a product to restock.");
      return;
    }
    if (qtyNum <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }
    const costNum = Number.parseFloat(unitCost);
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

  return (
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
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {p.stock} on hand
                </option>
              ))}
            </select>
          </label>

          {selectedProduct && (
            <div className="stockin-preview">
              <span>
                Current stock: <strong>{selectedProduct.stock}</strong> bottles
              </span>
              <span>
                After restock: <strong>{selectedProduct.stock + Math.max(0, qtyNum)}</strong>{" "}
                bottles
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
                required
              />
            </label>
          </div>

          <label>
            <span>Supplier name</span>
            <input
              value={supplierName}
              onChange={(event) => setSupplierName(event.target.value)}
              placeholder="e.g. Grasse Botanicals"
            />
          </label>

          <label>
            <span>Notes (optional)</span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Batch or delivery reference"
            />
          </label>

          <div className="erp-modal-actions">
            <button type="button" className="outline-button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              <PackagePlus size={15} aria-hidden="true" />
              <span>{submitting ? "Updating stock…" : "Record stock-in"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
