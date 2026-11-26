import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import StorefrontLayout from "../../components/StorefrontLayout.jsx";
import BottleArt, { getStockStatus, mapProduct } from "../../components/BottleArt.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import { useBag } from "../../hooks/useBag.jsx";
import { api } from "../../services/apiClient.js";
import { formatPrice } from "../../utils/formatMoney.js";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { bag, saved, addToBag, setBagOpen, toggleSaved, syncBagWithProducts } = useBag();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setQuantity(1);
  }, [id]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    setRelated([]);

    api
      .get(`/products/${id}`)
      .then((response) => {
        if (ignore) return;
        const mapped = mapProduct(response.data, 0);
        setProduct(mapped);
        syncBagWithProducts([mapped]);

        if (mapped.categoryId) {
          api
            .get(`/products?categoryId=${mapped.categoryId}&limit=4`)
            .then((relRes) => {
              if (ignore) return;
              const siblings = relRes.data
                .map((item, idx) => mapProduct(item, idx))
                .filter((item) => item.id !== mapped.id)
                .slice(0, 3);
              setRelated(siblings);
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (!ignore) {
          setProduct(null);
          setError(err.message || "We could not find this fragrance.");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    const handleFocusRefresh = () => {
      if (document.visibilityState === "visible") {
        setReloadKey((k) => k + 1);
      }
    };
    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleFocusRefresh);

    return () => {
      ignore = true;
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleFocusRefresh);
    };
  }, [id, reloadKey, syncBagWithProducts]);

  const bagQuantity = product ? bag.find((item) => item.id === product.id)?.quantity || 0 : 0;
  const maxAddable = product ? Math.max(0, product.stock - bagQuantity) : 0;

  useEffect(() => {
    if (maxAddable > 0 && quantity > maxAddable) {
      setQuantity(maxAddable);
    } else if (maxAddable === 0) {
      setQuantity(1);
    }
  }, [maxAddable, quantity]);

  const isSaved = product ? saved.includes(product.id) : false;
  const stockMeta = product ? getStockStatus(product.stock, product.reorderLevel) : null;

  return (
    <StorefrontLayout>
      <main className="product-detail-page">
        <div className="product-detail-top">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/catalog">Fragrances</Link>
            {product && (
              <>
                <span aria-hidden="true">/</span>
                <Link to={`/catalog?category=${product.categoryId || ""}`}>{product.family}</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{product.name}</span>
              </>
            )}
          </nav>
          <Link className="product-back-link" to="/catalog">
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Back to catalog</span>
          </Link>
        </div>

        {loading ? (
          <div className="catalog-status" role="status">
            Preparing fragrance details…
          </div>
        ) : error || !product ? (
          <section className="catalog-status catalog-status-error" role="alert">
            <p>{error || "This fragrance is currently unavailable."}</p>
            <Link className="collection-footer-cta" to="/catalog">
              <span>Return to fragrance catalog</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <>
            <section className="product-detail-grid" aria-labelledby="product-detail-title">
              <div className={`product-detail-media ${product.tone}`}>
                <BottleArt name={product.name} tone={product.tone} large />
                <span className="product-label">{product.family.toUpperCase()}</span>
                <button
                  type="button"
                  className={`save-button ${isSaved ? "saved" : ""}`}
                  onClick={() => toggleSaved(product.id)}
                  aria-pressed={isSaved}
                  aria-label={
                    isSaved ? `Remove ${product.name} from saved` : `Save ${product.name}`
                  }
                >
                  <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="product-detail-info">
                <p className="eyebrow">
                  {product.brand} {product.sku ? `· ${product.sku}` : ""}
                </p>
                <h1 id="product-detail-title">{product.name}</h1>

                <div className="product-detail-price-row">
                  <strong className="product-detail-price">{formatPrice(product.price)}</strong>
                  <span className="product-detail-volume">{product.size}</span>
                </div>

                <p className={`stock-note product-detail-stock ${stockMeta.className}`}>
                  <i /> {stockMeta.detailLabel}
                </p>

                <p className="product-detail-description">
                  {product.description ||
                    `An intimate ${product.family.toLowerCase()} eau de parfum composed to unfold slowly on warm skin.`}
                </p>

                <div className="product-detail-purchase">
                  {product.stock > 0 && maxAddable > 0 ? (
                    <>
                      <div className="detail-qty-row">
                        <span>Quantity</span>
                        <div className="quantity-control detail-qty-control">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span aria-live="polite">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.min(maxAddable, q + 1))}
                            disabled={quantity >= maxAddable}
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="button button-dark detail-add-button"
                        onClick={() => addToBag(product, quantity)}
                      >
                        <span>Add to bag · {formatPrice(Number(product.price) * quantity)}</span>
                        <ShoppingBag size={16} aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="button button-dark detail-add-button"
                      disabled
                    >
                      <span>
                        {product.stock === 0 ? "Out of stock" : "All available stock in bag"}
                      </span>
                    </button>
                  )}

                  {bagQuantity > 0 && (
                    <button
                      type="button"
                      className="detail-view-bag"
                      onClick={() => setBagOpen(true)}
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>
                        {bagQuantity} {bagQuantity === 1 ? "bottle" : "bottles"} in your bag · View
                        bag
                      </span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>

                <dl className="product-detail-specs">
                  <div>
                    <dt>Olfactory Family</dt>
                    <dd>{product.family}</dd>
                  </div>
                  <div>
                    <dt>Concentration</dt>
                    <dd>Eau de Parfum</dd>
                  </div>
                  <div>
                    <dt>Volume</dt>
                    <dd>{product.volume}</dd>
                  </div>
                  <div>
                    <dt>Payment</dt>
                    <dd>Cash on Delivery</dd>
                  </div>
                </dl>
              </div>
            </section>

            {related.length > 0 && (
              <section className="related-section" aria-labelledby="related-heading">
                <div className="related-heading">
                  <div>
                    <p className="eyebrow">IN THE SAME FAMILY</p>
                    <h2 id="related-heading">
                      More from <em>{product.family}</em>
                    </h2>
                  </div>
                  <Link className="collection-footer-cta" to={`/catalog?category=${product.categoryId}`}>
                    <span>View all {product.family}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
                <div className="catalog-grid" role="list">
                  {related.map((item) => (
                    <ProductCard key={item.id} product={item} showBadge={false} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </StorefrontLayout>
  );
}
