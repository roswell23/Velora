import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import { useBag } from "../hooks/useBag.jsx";
import BottleArt from "./BottleArt.jsx";
import { formatCents, formatPrice } from "../utils/formatMoney.js";

export default function StorefrontLayout({
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
}) {
  const { user, loading: authLoading, logout } = useAuth();
  const { bag, bagOpen, setBagOpen, bagTriggerRef, bagCount, bagTotalCents, changeQuantity } =
    useBag();
  const bagCloseRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const controlledSearch = searchValue !== undefined;
  const activeSearch = controlledSearch ? searchValue : localSearch;
  const isProductsActive =
    location.pathname.startsWith("/catalog") || location.pathname.startsWith("/product/");

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!bagOpen) return undefined;

    const triggerEl = bagTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    bagCloseRef.current?.focus();

    function handleDialogKeys(event) {
      if (event.key === "Escape") {
        setBagOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = document.querySelectorAll(
        ".bag-drawer a[href], .bag-drawer button:not(:disabled), .bag-drawer [tabindex]:not([tabindex='-1'])"
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.removeEventListener("keydown", handleDialogKeys);
      document.body.style.overflow = previousOverflow;
      triggerEl?.focus();
    };
  }, [bagOpen, bagTriggerRef, setBagOpen]);

  function handleSearchInput(event) {
    const nextValue = event.target.value;
    if (controlledSearch && onSearchChange) {
      onSearchChange(nextValue);
    } else {
      setLocalSearch(nextValue);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const term = activeSearch.trim();
    if (location.pathname === "/catalog") return;
    navigate(term ? `/catalog?search=${encodeURIComponent(term)}` : "/catalog");
  }

  return (
    <div className="storefront">
      <Link className="announcement-bar" to="/catalog">
        <Sparkles size={13} strokeWidth={1.5} aria-hidden="true" />
        <span>Explore the full Vélora fragrance catalog</span>
        <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" />
      </Link>

      <header className="store-header">
        <button
          type="button"
          className="icon-button mobile-menu-button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="store-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link className="wordmark" to="/" aria-label="Vélora home">
          VÉLORA<span>®</span>
        </Link>
        <nav
          id="store-navigation"
          className={`store-nav ${menuOpen ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <NavLink
            to="/catalog"
            className={isProductsActive ? "is-current" : ""}
            onClick={() => setMenuOpen(false)}
          >
            Fragrances
          </NavLink>
          <Link to="/#story" onClick={() => setMenuOpen(false)}>
            Our story
          </Link>
          <Link to="/#ritual" onClick={() => setMenuOpen(false)}>
            The Vélora ritual
          </Link>
        </nav>
        <div className="header-actions">
          <form className="header-search" role="search" onSubmit={handleSearchSubmit}>
            <Search size={16} aria-hidden="true" />
            <input
              aria-label="Search fragrances"
              value={activeSearch}
              onChange={handleSearchInput}
              placeholder={searchPlaceholder}
            />
          </form>
          {!authLoading &&
            (user ? (
              <div className="account-actions">
                <span className="account-greeting" title={user.email}>
                  <User size={15} strokeWidth={1.5} />
                  <span className="account-name">{user.name.split(" ")[0]}</span>
                </span>
                <button type="button" className="auth-header-action" onClick={logout}>
                  Sign out
                </button>
              </div>
            ) : (
              <Link className="auth-header-action" to="/login">
                <User size={15} strokeWidth={1.5} />
                <span>Sign in</span>
              </Link>
            ))}
          <button
            type="button"
            className="bag-trigger"
            ref={bagTriggerRef}
            onClick={() => setBagOpen(true)}
            aria-label={`Open shopping bag, ${bagCount} items`}
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            <span className="bag-label">Bag</span>
            <span className="bag-count">{bagCount}</span>
          </button>
        </div>
      </header>

      {children}

      <footer className="store-footer">
        <Link className="wordmark footer-mark" to="/">
          VÉLORA<span>®</span>
        </Link>
        <p>The essence of elegance.</p>
        <div>
          <Link to="/#story">Our story</Link>
          <Link to="/catalog">Fragrances</Link>
          <a href="mailto:hello@velora.example">Contact</a>
        </div>
        <small>© 2026 VÉLORA. A study in scent.</small>
      </footer>

      {bagOpen && (
        <div
          className="drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setBagOpen(false);
          }}
        >
          <aside
            className="bag-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bag-dialog-title"
            tabIndex={-1}
          >
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">YOUR SELECTION</p>
                <h2>
                  <span id="bag-dialog-title">The fragrance bag</span> <span>({bagCount})</span>
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                ref={bagCloseRef}
                onClick={() => setBagOpen(false)}
                aria-label="Close bag"
              >
                <X size={20} />
              </button>
            </div>
            {bag.length ? (
              <>
                <div className="drawer-items">
                  {bag.map((item) => (
                    <div className="drawer-item" key={item.id}>
                      <BottleArt name={item.name} tone={item.tone} />
                      <div className="drawer-item-copy">
                        <span>
                          {item.family} · {item.size.split(" · ")[0]}
                        </span>
                        <h3>
                          <Link to={`/product/${item.id}`} onClick={() => setBagOpen(false)}>
                            {item.name}
                          </Link>
                        </h3>
                        <strong>{formatPrice(item.price)}</strong>
                        <div className="quantity-control">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label={`Remove one ${item.name}`}
                          >
                            <Minus size={13} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label={`Add one ${item.name}`}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="drawer-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatCents(bagTotalCents)}</strong>
                  </div>
                  <p>
                    <Check size={14} /> Cash on Delivery available at checkout
                  </p>
                  <Link
                    className="button button-dark drawer-continue"
                    to={user ? "/checkout" : "/login"}
                    state={user ? undefined : { from: "/checkout" }}
                    onClick={() => setBagOpen(false)}
                  >
                    {user ? "Proceed to checkout" : "Sign in to checkout"}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="empty-bag">
                <ShoppingBag size={26} strokeWidth={1.2} />
                <h3>A little room for something lovely.</h3>
                <p>Your bag is waiting for its first fragrance.</p>
                <Link className="text-link" to="/catalog" onClick={() => setBagOpen(false)}>
                  Explore fragrances <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
