import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Heart,
  Menu,
  Minus,
  Pause,
  Plus,
  Play,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth.jsx";
import LoginPage from "./features/auth/LoginPage.jsx";
import RegisterPage from "./features/auth/RegisterPage.jsx";
import CheckoutPage from "./features/checkout/CheckoutPage.jsx";
import { api } from "./services/apiClient.js";
import { formatCents, formatPrice, toCents } from "./utils/formatMoney.js";

const familyTone = { Woody: "sand", Floral: "rose", Oriental: "amber", Citrus: "cream" };

function mapProduct(product, index) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    family: product.category?.name || "Fragrance",
    size: `${product.size} · Eau de parfum`,
    price: product.unitPrice,
    stock: product.stock,
    reorderLevel: product.reorderLevel,
    imageUrl: product.imageUrl,
    label: ["SIGNATURE", "ATELIER EDIT", "NEW ARRIVAL"][index] || "",
    tone: familyTone[product.category?.name] || "sand",
  };
}

function BottleArt({ name, tone, large = false }) {
  return (
    <div
      className={`bottle-art ${tone} ${large ? "bottle-large" : ""}`}
      role="img"
      aria-label={`${name} Vélora perfume bottle illustration`}
    >
      <div className="bottle-light" />
      <div className="bottle-shadow" />
      <div className="bottle-cap" />
      <div className="bottle-neck" />
      <div className="bottle-vessel">
        <div className="bottle-label">
          <span>VÉLORA</span>
          <i />
          <small>{name.toUpperCase()}</small>
        </div>
      </div>
      <span className="bottle-caption">EAU DE PARFUM · PARIS</span>
    </div>
  );
}

function StorefrontPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [fragrances, setFragrances] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);
  const [family, setFamily] = useState("All fragrances");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("curated");
  const [featuredId, setFeaturedId] = useState(null);
  const [canScrollCarouselBack, setCanScrollCarouselBack] = useState(false);
  const [canScrollCarouselForward, setCanScrollCarouselForward] = useState(false);
  const [carouselAutoplayEnabled, setCarouselAutoplayEnabled] = useState(true);
  const [carouselHovered, setCarouselHovered] = useState(false);
  const [carouselFocused, setCarouselFocused] = useState(false);
  const [carouselPointerDown, setCarouselPointerDown] = useState(false);
  const [pageIsVisible, setPageIsVisible] = useState(() => document.visibilityState === "visible");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const productCarouselRef = useRef(null);
  const [bag, setBag] = useState(() => {
    try {
      const storedBag = JSON.parse(localStorage.getItem("velora_boutique_bag") || "[]");
      return Array.isArray(storedBag) ? storedBag : [];
    } catch {
      return [];
    }
  });
  const [bagOpen, setBagOpen] = useState(false);
  const bagTriggerRef = useRef(null);
  const bagCloseRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState([]);

  const visibleFragrances = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = fragrances.filter((item) => {
      const matchesFamily = family === "All fragrances" || item.family === family;
      const matchesSearch =
        !term || `${item.name} ${item.family} ${item.brand}`.toLowerCase().includes(term);
      return matchesFamily && matchesSearch;
    });
    if (sort === "price-low") return filtered.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-high") return filtered.sort((a, b) => Number(b.price) - Number(a.price));
    return filtered;
  }, [family, search, sort]);
  const families = useMemo(
    () => ["All fragrances", ...new Set(fragrances.map((item) => item.family))],
    [fragrances]
  );
  const featuredFragrance = fragrances.find((item) => item.id === featuredId) || fragrances[0] || null;

  useEffect(() => {
    let ignore = false;
    setCatalogLoading(true);
    setCatalogError("");

    api
      .get("/products?limit=100&sort=newest")
      .then((response) => {
        if (ignore) return;
        const products = response.data.map(mapProduct);
        setFragrances(products);
        setFeaturedId(products[0]?.id ?? null);
      })
      .catch((error) => {
        if (!ignore) setCatalogError(error.message || "Could not load the fragrance collection.");
      })
      .finally(() => {
        if (!ignore) setCatalogLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [catalogReloadKey]);

  useEffect(() => {
    if (!fragrances.length) return;
    setBag((currentBag) =>
      currentBag.flatMap((item) => {
        const product = fragrances.find((candidate) => candidate.name === item.name);
        if (!product || product.stock <= 0) return [];
        return [{ ...product, quantity: Math.min(item.quantity, product.stock) }];
      })
    );
  }, [fragrances]);

  const updateCarouselControls = useCallback(() => {
    const carousel = productCarouselRef.current;
    if (!carousel) {
      setCanScrollCarouselBack(false);
      setCanScrollCarouselForward(false);
      return;
    }
    setCanScrollCarouselBack(carousel.scrollLeft > 2);
    setCanScrollCarouselForward(
      carousel.scrollLeft < carousel.scrollWidth - carousel.clientWidth - 2
    );
  }, []);

  function moveProductCarousel(direction) {
    const carousel = productCarouselRef.current;
    const firstProduct = carousel?.querySelector(".product-card");
    if (!carousel || !firstProduct) return;
    const gap = Number.parseFloat(window.getComputedStyle(carousel).columnGap) || 0;
    const step = firstProduct.getBoundingClientRect().width + gap;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    carousel.scrollBy({ left: direction * step, behavior });
  }

  useEffect(() => {
    localStorage.setItem("velora_boutique_bag", JSON.stringify(bag));
  }, [bag]);

  useEffect(() => {
    const carousel = productCarouselRef.current;
    if (!carousel) {
      updateCarouselControls();
      return undefined;
    }
    carousel.scrollTo({ left: 0, behavior: "auto" });
    const frameId = window.requestAnimationFrame(updateCarouselControls);
    return () => window.cancelAnimationFrame(frameId);
  }, [visibleFragrances, family, search, sort, updateCarouselControls]);

  useEffect(() => {
    window.addEventListener("resize", updateCarouselControls);
    return () => window.removeEventListener("resize", updateCarouselControls);
  }, [updateCarouselControls]);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionPreference = () => setPrefersReducedMotion(motionPreference.matches);
    const handleVisibilityChange = () => setPageIsVisible(document.visibilityState === "visible");

    motionPreference.addEventListener("change", handleMotionPreference);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      motionPreference.removeEventListener("change", handleMotionPreference);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (
      !carouselAutoplayEnabled ||
      prefersReducedMotion ||
      carouselHovered ||
      carouselFocused ||
      carouselPointerDown ||
      !pageIsVisible ||
      visibleFragrances.length < 2
    ) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const carousel = productCarouselRef.current;
      const firstProduct = carousel?.querySelector(".product-card");
      if (!carousel || !firstProduct) return;

      const gap = Number.parseFloat(window.getComputedStyle(carousel).columnGap) || 0;
      const step = firstProduct.getBoundingClientRect().width + gap;
      const maximumScroll = carousel.scrollWidth - carousel.clientWidth;
      const behavior = prefersReducedMotion ? "auto" : "smooth";

      if (maximumScroll <= 2) return;
      if (carousel.scrollLeft >= maximumScroll - 2) {
        carousel.scrollTo({ left: 0, behavior });
      } else if (carousel.scrollLeft + step >= maximumScroll - 2) {
        carousel.scrollTo({ left: maximumScroll, behavior });
      } else {
        carousel.scrollBy({ left: step, behavior });
      }
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, [
    carouselAutoplayEnabled,
    carouselFocused,
    carouselHovered,
    carouselPointerDown,
    pageIsVisible,
    prefersReducedMotion,
    visibleFragrances,
  ]);

  useEffect(() => {
    if (!bagOpen) return undefined;

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
      bagTriggerRef.current?.focus();
    };
  }, [bagOpen]);

  const bagCount = bag.reduce((total, item) => total + item.quantity, 0);
  const bagTotalCents = bag.reduce(
    (total, item) => total + toCents(item.price) * BigInt(item.quantity),
    0n
  );

  function addToBag(fragrance) {
    setBag((current) => {
      const existing = current.find((item) => item.id === fragrance.id);
      if (existing) {
        return current.map((item) =>
          item.id === fragrance.id
            ? { ...item, quantity: Math.min(item.stock, item.quantity + 1) }
            : item
        );
      }
      return [...current, { ...fragrance, quantity: 1 }];
    });
    setBagOpen(true);
  }

  function changeQuantity(id, change) {
    setBag((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.min(item.stock, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function toggleSaved(id) {
    setSaved((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]
    );
  }

  function resetCollection() {
    setSearch("");
    setFamily("All fragrances");
    setSort("curated");
  }

  return (
    <div className="storefront">
      <div className="announcement-bar">
        <Sparkles size={13} strokeWidth={1.5} />
        <span>A first look at the Vélora fragrance collection</span>
        <ArrowRight size={13} strokeWidth={1.5} />
      </div>

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
        <a className="wordmark" href="#top" aria-label="Vélora home">
          VÉLORA<span>®</span>
        </a>
        <nav
          id="store-navigation"
          className={`store-nav ${menuOpen ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <a href="#collection" onClick={() => setMenuOpen(false)}>
            Fragrances
          </a>
          <a href="#story" onClick={() => setMenuOpen(false)}>
            Our story
          </a>
          <a href="#ritual" onClick={() => setMenuOpen(false)}>
            The Vélora ritual
          </a>
        </nav>
        <div className="header-actions">
          <label className="header-search" aria-label="Search fragrances">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
            />
          </label>
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

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> THE VÉLORA EDIT
            </p>
            <h1>
              A little
              <br />
              <em>of yourself</em>
              <br />
              in the air.
            </h1>
            <p className="hero-description">
              {featuredFragrance ? (
                <>
                  Meet <strong>{featuredFragrance.name}</strong>, a {featuredFragrance.family.toLowerCase()} fragrance
                  made for the moments that become memories.
                </>
              ) : catalogLoading ? (
                "Preparing the Vélora collection…"
              ) : (
                "The fragrance collection is temporarily unavailable."
              )}
            </p>
            {featuredFragrance && (
              <div className="hero-product-price">
                <span>{featuredFragrance.family} · {featuredFragrance.size.split(" · ")[0]}</span>
                <strong>{formatPrice(featuredFragrance.price)}</strong>
                <small className={featuredFragrance.stock <= featuredFragrance.reorderLevel ? "is-low-stock" : ""}>
                  {featuredFragrance.stock === 0
                    ? "Currently unavailable"
                    : featuredFragrance.stock <= featuredFragrance.reorderLevel
                      ? `Only ${featuredFragrance.stock} left`
                      : "In stock"}
                </small>
              </div>
            )}
            <button
              type="button"
              className="button button-dark hero-add-button"
              onClick={() => featuredFragrance && addToBag(featuredFragrance)}
              disabled={!featuredFragrance || featuredFragrance.stock === 0}
            >
              {!featuredFragrance
                ? catalogLoading
                  ? "Loading collection…"
                  : "Collection unavailable"
                : featuredFragrance.stock === 0
                  ? "Out of stock"
                  : "Add to bag"}
              {featuredFragrance?.stock > 0 && <ShoppingBag size={15} />}
            </button>
            <a className="hero-collection-link" href="#collection">
              Explore the collection <ArrowRight size={14} />
            </a>
            <div className="hero-footnote">
              <span className="hero-index">
                {featuredFragrance
                  ? `0${fragrances.findIndex((item) => item.id === featuredId) + 1} / ${String(fragrances.length).padStart(2, "0")}`
                  : "00 / 00"}
              </span>
              <span className="hero-line" />
              <span>SCENT, WITH INTENTION</span>
            </div>
          </div>
          <div
            className={`hero-art ${featuredFragrance?.tone || "sand"}`}
            role="img"
            aria-label={
              featuredFragrance
                ? `${featuredFragrance.name}, Vélora eau de parfum`
                : "Vélora perfume collection"
            }
          >
            <div className="hero-art-orbit" />
            <div className="hero-art-wash" />
            {featuredFragrance && (
              <>
                <BottleArt name={featuredFragrance.name} tone={featuredFragrance.tone} large />
                <div className="hero-art-note">
                  <span>AN ATELIER SIGNATURE</span>
                  <strong>{featuredFragrance.name}</strong>
                  <span>{featuredFragrance.family.toUpperCase()} · EAU DE PARFUM</span>
                </div>
              </>
            )}
            <div className="hero-art-caption">
              <span>CRAFTED TO LINGER</span>
            </div>
            {featuredFragrance && (
              <div className="hero-roundel">
                <span>
                  {featuredFragrance.size.split(" · ")[0].toUpperCase()}
                  <br />
                  VÉLORA
                </span>
              </div>
            )}
          </div>
          {fragrances.length > 0 && (
          <aside className="hero-fragrance-rail" aria-label="Choose a featured fragrance">
            <p className="eyebrow">THE EDIT</p>
            <div className="hero-fragrance-options">
              {fragrances.slice(0, 4).map((fragrance, index) => (
                <button
                  key={fragrance.id}
                  type="button"
                  className={`hero-fragrance-option ${featuredId === fragrance.id ? "is-selected" : ""}`}
                  aria-pressed={featuredId === fragrance.id}
                  onClick={() => setFeaturedId(fragrance.id)}
                >
                  <span className={`hero-mini-bottle ${fragrance.tone}`} aria-hidden="true">
                    <BottleArt name={fragrance.name} tone={fragrance.tone} />
                  </span>
                  <span className="hero-option-copy">
                    <small>0{index + 1} · {fragrance.family}</small>
                    <strong>{fragrance.name}</strong>
                    <span>{formatPrice(fragrance.price)}</span>
                  </span>
                </button>
              ))}
            </div>
            <a className="hero-rail-link" href="#collection">
              View all scents <ArrowRight size={13} />
            </a>
          </aside>
          )}
          <a className="scroll-cue" href="#collection" aria-label="Scroll to collection">
            <ArrowDown size={15} />
          </a>
        </section>

        <section className="trust-strip" aria-label="Our standards">
          <span>COMPOSED IN GRASSE</span>
          <i />
          <span>CONSCIOUSLY SOURCED</span>
          <i />
          <span>MADE TO BE REMEMBERED</span>
        </section>

        <section
          className="collection-section"
          id="collection"
          onFocusCapture={() => setCarouselFocused(true)}
          onBlurCapture={(event) =>
            setCarouselFocused(event.currentTarget.contains(event.relatedTarget))
          }
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE VÉLORA COLLECTION</p>
              <h2>
                Find your <em>almost indescribable.</em>
              </h2>
            </div>
            <div className="collection-heading-actions">
              <p className="section-aside">A study in feeling, bottled.</p>
              <div
                className="carousel-controls"
                aria-label="Collection carousel controls"
                onMouseEnter={() => setCarouselHovered(true)}
                onMouseLeave={() => setCarouselHovered(false)}
              >
                <button
                  type="button"
                  className={`carousel-autoplay-button ${carouselAutoplayEnabled && !prefersReducedMotion ? "is-active" : ""}`}
                  aria-label={
                    prefersReducedMotion
                      ? "Automatic carousel disabled by reduced-motion preference"
                      : carouselAutoplayEnabled
                        ? "Pause automatic carousel"
                        : "Play automatic carousel"
                  }
                  aria-pressed={carouselAutoplayEnabled && !prefersReducedMotion}
                  disabled={prefersReducedMotion}
                  onClick={() => setCarouselAutoplayEnabled((enabled) => !enabled)}
                >
                  {carouselAutoplayEnabled && !prefersReducedMotion ? (
                    <Pause size={14} />
                  ) : (
                    <Play size={14} />
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Show previous fragrances"
                  aria-controls="fragrance-carousel"
                  disabled={!canScrollCarouselBack}
                  onClick={() => moveProductCarousel(-1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Show more fragrances"
                  aria-controls="fragrance-carousel"
                  disabled={!canScrollCarouselForward}
                  onClick={() => moveProductCarousel(1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="collection-controls">
            <div className="family-tabs" role="group" aria-label="Filter by fragrance family">
              {families.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={family === item ? "family-tab active" : "family-tab"}
                  aria-pressed={family === item}
                  onClick={() => setFamily(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="sort-select-wrap">
              <span className="sr-only">Sort fragrances</span>
              <select
                className="sort-select"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="curated">Curated edit</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>

          {catalogLoading ? (
            <div className="catalog-status" role="status">Loading the Vélora collection…</div>
          ) : catalogError ? (
            <div className="catalog-status catalog-status-error" role="alert">
              <p>{catalogError}</p>
              <button type="button" onClick={() => setCatalogReloadKey((key) => key + 1)}>
                Try again
              </button>
            </div>
          ) : visibleFragrances.length ? (
            <div
              className="product-carousel-track"
              id="fragrance-carousel"
              ref={productCarouselRef}
              role="list"
              aria-label="Fragrance collection"
              aria-live="off"
              onMouseEnter={() => setCarouselHovered(true)}
              onMouseLeave={() => setCarouselHovered(false)}
              onPointerDown={() => setCarouselPointerDown(true)}
              onPointerUp={() => setCarouselPointerDown(false)}
              onPointerCancel={() => setCarouselPointerDown(false)}
              onPointerLeave={() => setCarouselPointerDown(false)}
              onScroll={updateCarouselControls}
            >
              {visibleFragrances.map((product, index) => (
                <article className="product-card" key={product.id} role="listitem">
                  <div className={`product-image ${product.tone}`}>
                    <BottleArt name={product.name} tone={product.tone} />
                    {product.label && <span className="product-label">{product.label}</span>}
                    <button
                      type="button"
                      className={`save-button ${saved.includes(product.id) ? "saved" : ""}`}
                      onClick={() => toggleSaved(product.id)}
                      aria-label={
                        saved.includes(product.id)
                          ? `Remove ${product.name} from saved`
                          : `Save ${product.name}`
                      }
                    >
                      <Heart
                        size={16}
                        fill={saved.includes(product.id) ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      type="button"
                      className={`quick-add ${product.stock === 0 ? "disabled" : ""}`}
                      disabled={product.stock === 0}
                      onClick={() => addToBag(product)}
                    >
                      {product.stock === 0 ? (
                        "Out of stock"
                      ) : (
                        <>
                          <Plus size={15} /> Add to bag
                        </>
                      )}
                    </button>
                  </div>
                  <div className="product-meta">
                    <div>
                      <p className="product-family">
                        {product.family} · {product.size.split(" · ")[0]}
                      </p>
                      <h3>{product.name}</h3>
                    </div>
                    <span className="product-price">{formatPrice(product.price)}</span>
                  </div>
                  <p className="product-size">{product.size}</p>
                  <p
                    className={`stock-note ${product.stock <= product.reorderLevel ? "stock-note-low" : ""}`}
                  >
                    <i />{" "}
                    {product.stock === 0
                      ? "Out of stock"
                      : product.stock <= product.reorderLevel
                        ? `Low stock · ${product.stock} left`
                        : "In stock"}
                  </p>
                  <span className="product-number">0{index + 1}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-search">
              <Search size={20} />
              <p>
                No fragrances match your current search and filters.
              </p>
              <button type="button" onClick={resetCollection}>
                Clear filters
              </button>
            </div>
          )}
          <div className="catalog-link-wrap">
            <span aria-live="polite" aria-atomic="true">
              {visibleFragrances.length} {visibleFragrances.length === 1 ? "fragrance" : "fragrances"} in this collection
            </span>
            <button
              type="button"
              onClick={resetCollection}
            >
              View the full collection <ArrowRight size={15} />
            </button>
          </div>
        </section>

        <section className="story-section" id="story">
          <div className="story-image">
            <img
              src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1200&q=85"
              alt="Perfumer's materials arranged for a fragrance composition"
              loading="lazy"
            />
            <span className="image-note">NOTES FROM THE ATELIER · Nº 03</span>
          </div>
          <div className="story-copy">
            <p className="eyebrow">A QUIETER KIND OF LUXURY</p>
            <h2>
              Made for the
              <br />
              <em>space between</em>
              <br />
              hello and goodbye.
            </h2>
            <p>
              We believe the most beautiful things do not announce themselves. They unfold. Each
              Vélora composition is made to move with you, changing softly as the day becomes yours.
            </p>
            <a href="#ritual" className="text-link">
              A note from our founders <ArrowRight size={15} />
            </a>
          </div>
        </section>

        <section className="ritual-section" id="ritual">
          <p className="eyebrow">THE VÉLORA RITUAL</p>
          <h2>
            Make room for <em>the feeling.</em>
          </h2>
          <div className="ritual-steps">
            <div>
              <span>01</span>
              <h3>Begin close</h3>
              <p>Two spritzes, where your pulse tells its story.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Let it settle</h3>
              <p>Give each note a moment to find its place.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Make it yours</h3>
              <p>Wear it your way. There is no wrong way.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="store-footer">
        <a className="wordmark footer-mark" href="#top">
          VÉLORA<span>®</span>
        </a>
        <p>The essence of elegance.</p>
        <div>
          <a href="#story">Our story</a>
          <a href="#collection">Fragrances</a>
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
                        <h3>{item.name}</h3>
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
                <button type="button" className="text-link" onClick={() => setBagOpen(false)}>
                  Explore fragrances <ArrowRight size={15} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StorefrontPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
