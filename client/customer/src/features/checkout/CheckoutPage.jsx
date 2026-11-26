import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { api } from "../../services/apiClient.js";
import { formatCents, formatPrice, toCents } from "../../utils/formatMoney.js";

const BAG_KEY = "velora_boutique_bag";

function readBag() {
  try {
    const storedBag = JSON.parse(localStorage.getItem(BAG_KEY) || "[]");
    return Array.isArray(storedBag) ? storedBag : [];
  } catch {
    return [];
  }
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const [bag, setBag] = useState(readBag);
  const [form, setForm] = useState({ phone: "", deliveryAddress: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);

  const subtotalCents = useMemo(
    () => bag.reduce((total, item) => total + toCents(item.price) * BigInt(item.quantity), 0n),
    [bag]
  );

  useEffect(() => {
    if (authLoading || !user) return undefined;
    let ignore = false;
    setProfileLoading(true);

    api
      .get("/my/profile")
      .then((response) => {
        if (ignore) return;
        setForm({
          phone: response.data.phone || "",
          deliveryAddress: response.data.address || "",
        });
      })
      .catch((error) => {
        if (!ignore) setProfileError(error.message || "Could not load your delivery details.");
      })
      .finally(() => {
        if (!ignore) setProfileLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [authLoading, user]);

  if (authLoading) {
    return <main className="checkout-loading" role="status">Checking your account…</main>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/checkout" }} />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError("");
    setProfileError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || profileLoading || bag.length === 0) return;

    if (form.phone.trim().length < 7 || form.phone.trim().length > 30) {
      setFormError("Enter a phone number between 7 and 30 characters.");
      return;
    }
    if (form.deliveryAddress.trim().length < 5 || form.deliveryAddress.trim().length > 500) {
      setFormError("Enter a delivery address between 5 and 500 characters.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const response = await api.post("/my/orders", {
        items: bag.map((item) => ({ productId: Number(item.id), quantity: item.quantity })),
        deliveryAddress: form.deliveryAddress.trim(),
        phone: form.phone.trim(),
      });
      setOrder(response.data);
      setBag([]);
      localStorage.removeItem(BAG_KEY);
    } catch (error) {
      setFormError(error.message || "We couldn't place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    return (
      <main className="checkout-page">
        <section className="checkout-success" aria-labelledby="checkout-success-title">
          <CheckCircle2 size={34} strokeWidth={1.4} />
          <p className="eyebrow">ORDER RECEIVED</p>
          <h1 id="checkout-success-title">Thank you, {user.name.split(" ")[0]}.</h1>
          <p>Your order has been placed. We’ll prepare it for Cash on Delivery.</p>
          <div className="checkout-order-number">
            <span>Order number</span>
            <strong>{order.orderNumber}</strong>
          </div>
          <div className="checkout-order-number">
            <span>Order total</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>
          <Link className="button button-dark" to="/">
            Return to the boutique <ArrowRight size={15} />
          </Link>
        </section>
      </main>
    );
  }

  if (bag.length === 0) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <p className="eyebrow">YOUR SELECTION</p>
          <h1>Your bag is empty.</h1>
          <p>Choose a fragrance before continuing to checkout.</p>
          <Link className="button button-dark" to="/">
            Explore fragrances <ArrowRight size={15} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <Link className="wordmark" to="/" aria-label="Vélora home">
          VÉLORA<span>®</span>
        </Link>
        <span><ShieldCheck size={15} /> Secure checkout</span>
      </header>

      <div className="checkout-layout">
        <section className="checkout-form-panel" aria-labelledby="checkout-title">
          <Link className="checkout-back-link" to="/">
            <ArrowLeft size={14} /> Back to the boutique
          </Link>
          <p className="eyebrow">A FINAL, THOUGHTFUL STEP</p>
          <h1 id="checkout-title">Complete your order.</h1>
          <p className="checkout-intro">Your account details are ready. Confirm where you’d like your fragrance delivered.</p>

          {profileError && (
            <div className="checkout-message checkout-message-error" role="alert">
              {profileError} You can still enter your details below.
            </div>
          )}
          {formError && (
            <div className="checkout-message checkout-message-error" role="alert">
              {formError}
            </div>
          )}

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="checkout-field">
              <label htmlFor="checkout-phone">Contact phone</label>
              <input
                id="checkout-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
                disabled={profileLoading || submitting}
                placeholder="+63 917 123 4567"
                required
              />
            </div>
            <div className="checkout-field">
              <label htmlFor="checkout-address">Delivery address</label>
              <textarea
                id="checkout-address"
                name="deliveryAddress"
                autoComplete="street-address"
                rows="4"
                value={form.deliveryAddress}
                onChange={handleChange}
                disabled={profileLoading || submitting}
                placeholder="House or unit, street, city, and postal code"
                required
              />
            </div>
            <div className="checkout-cod-card">
              <span className="checkout-cod-mark"><CheckCircle2 size={16} /></span>
              <div>
                <strong>Cash on Delivery</strong>
                <p>Pay in cash when your order arrives.</p>
              </div>
              <span className="checkout-cod-fixed">FIXED</span>
            </div>
            <button
              type="submit"
              className="button button-dark checkout-submit"
              disabled={profileLoading || submitting}
            >
              {profileLoading ? "Loading your details…" : submitting ? "Placing your order…" : "Place order"}
              {!profileLoading && !submitting && <ArrowRight size={15} />}
            </button>
            <p className="checkout-note">Your total is verified against current product prices and stock before the order is placed.</p>
          </form>
        </section>

        <aside className="checkout-summary" aria-label="Order summary">
          <p className="eyebrow">YOUR SELECTION</p>
          <h2>Order summary <span>({bag.reduce((sum, item) => sum + item.quantity, 0)})</span></h2>
          <div className="checkout-summary-items">
            {bag.map((item) => (
              <div className="checkout-summary-item" key={item.id}>
                <span className={`checkout-summary-art ${item.tone}`} aria-hidden="true">
                  <span>VÉLORA</span>
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.family} · {item.size.split(" · ")[0]} · Qty {item.quantity}</span>
                </div>
                <strong>{formatCents(toCents(item.price) * BigInt(item.quantity))}</strong>
              </div>
            ))}
          </div>
          <div className="checkout-total">
            <span>Total · COD</span>
            <strong>{formatCents(subtotalCents)}</strong>
          </div>
          <p className="checkout-summary-footnote">Final total is recalculated securely when you place your order.</p>
        </aside>
      </div>
    </main>
  );
}
