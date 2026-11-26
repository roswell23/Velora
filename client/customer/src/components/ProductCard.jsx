import { Link } from "react-router-dom";
import { ArrowRight, Check, Heart, Plus } from "lucide-react";
import BottleArt, { getStockStatus } from "./BottleArt.jsx";
import { useBag } from "../hooks/useBag.jsx";
import { formatPrice } from "../utils/formatMoney.js";

export default function ProductCard({ product, index = null, showBadge = true }) {
  const { bag, saved, addToBag, setBagOpen, toggleSaved } = useBag();
  const isSaved = saved.includes(product.id);
  const bagQuantity = bag.find((item) => item.id === product.id)?.quantity || 0;
  const atStockLimit = product.stock > 0 && bagQuantity >= product.stock;
  const stockMeta = getStockStatus(product.stock, product.reorderLevel);

  return (
    <article className="product-card" role="listitem">
      <div className={`product-image ${product.tone}`}>
        <Link
          to={`/product/${product.id}`}
          className="product-image-link"
          aria-label={`View details for ${product.name}`}
        >
          <BottleArt name={product.name} tone={product.tone} />
        </Link>
        {showBadge && product.label && <span className="product-label">{product.label}</span>}
        <button
          type="button"
          className={`save-button ${isSaved ? "saved" : ""}`}
          onClick={() => toggleSaved(product.id)}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
        >
          <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="product-details">
        <div className="product-meta">
          <div>
            <p className="product-family">
              {product.family} · {product.volume}
            </p>
            <h3>
              <Link to={`/product/${product.id}`} className="product-title-link">
                {product.name}
              </Link>
            </h3>
          </div>
          <span className="product-price">{formatPrice(product.price)}</span>
        </div>
        <div className="product-size-row">
          <p className="product-size">{product.size}</p>
          {index !== null && (
            <span className="product-number">{String(index + 1).padStart(2, "0")}</span>
          )}
        </div>
        <div className="product-stock-row">
          <p className={`stock-note ${stockMeta.className}`}>
            <i /> {stockMeta.label}
          </p>
          <Link to={`/product/${product.id}`} className="product-detail-link">
            <span>Details</span>
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="product-actions">
        {product.stock === 0 ? (
          <button type="button" className="product-cta-add is-unavailable" disabled>
            Out of stock
          </button>
        ) : bagQuantity > 0 ? (
          <div className="product-cta-split">
            <button
              type="button"
              className="product-cta-in-bag"
              onClick={() => setBagOpen(true)}
              aria-label={`View ${product.name} in bag, quantity ${bagQuantity}`}
            >
              <Check size={14} aria-hidden="true" />
              <span>In bag ({bagQuantity}) · View</span>
            </button>
            <button
              type="button"
              className="product-cta-increment"
              disabled={atStockLimit}
              onClick={() => addToBag(product)}
              aria-label={
                atStockLimit
                  ? `Maximum stock reached for ${product.name}`
                  : `Add one more ${product.name} to bag`
              }
              title={atStockLimit ? "Maximum available stock in bag" : "Add another"}
            >
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" className="product-cta-add" onClick={() => addToBag(product)}>
            <Plus size={14} aria-hidden="true" />
            <span>Add to bag</span>
          </button>
        )}
      </div>
    </article>
  );
}
