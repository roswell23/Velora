import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import BottleArt, { mapProduct } from "./components/BottleArt.jsx";
import ProductCard from "./components/ProductCard.jsx";
import StorefrontLayout from "./components/StorefrontLayout.jsx";
import { BagProvider, useBag } from "./hooks/useBag.jsx";
import LoginPage from "./features/auth/LoginPage.jsx";
import RegisterPage from "./features/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./features/auth/ResetPasswordPage.jsx";
import CatalogPage from "./features/catalog/CatalogPage.jsx";
import ProductDetailPage from "./features/catalog/ProductDetailPage.jsx";
import CheckoutPage from "./features/checkout/CheckoutPage.jsx";
import { api } from "./services/apiClient.js";
import { formatPrice } from "./utils/formatMoney.js";

function StorefrontPage() {
  const { addToBag, syncBagWithProducts } = useBag();
  const location = useLocation();
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
  const [carouselHasOverflow, setCarouselHasOverflow] = useState(false);
  const [carouselProgress, setCarouselProgress] = useState(0);
  const [carouselAutoplayEnabled, setCarouselAutoplayEnabled] = useState(true);
  const [carouselHovered, setCarouselHovered] = useState(false);
  const [carouselFocused, setCarouselFocused] = useState(false);
  const [carouselPointerDown, setCarouselPointerDown] = useState(false);
  const [pageIsVisible, setPageIsVisible] = useState(() => document.visibilityState === "visible");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const productCarouselRef = useRef(null);

  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  }, [location.hash, prefersReducedMotion]);

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
  }, [fragrances, family, search, sort]);

  const isFiltered = family !== "All fragrances" || search.trim() !== "" || sort !== "curated";
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
        syncBagWithProducts(products);
      })
      .catch((error) => {
        if (!ignore) setCatalogError(error.message || "Could not load the fragrance collection.");
      })
      .finally(() => {
        if (!ignore) setCatalogLoading(false);
      });

    const handleFocusRefresh = () => {
      if (document.visibilityState === "visible") {
        setCatalogReloadKey((k) => k + 1);
      }
    };
    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleFocusRefresh);

    return () => {
      ignore = true;
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleFocusRefresh);
    };
  }, [catalogReloadKey, syncBagWithProducts]);

  const updateCarouselControls = useCallback(() => {
    const carousel = productCarouselRef.current;
    if (!carousel) {
      setCanScrollCarouselBack(false);
      setCanScrollCarouselForward(false);
      setCarouselHasOverflow(false);
      setCarouselProgress(0);
      return;
    }
    const maximumScroll = Math.max(0, carousel.scrollWidth - carousel.clientWidth);
    setCanScrollCarouselBack(carousel.scrollLeft > 2);
    setCanScrollCarouselForward(carousel.scrollLeft < maximumScroll - 2);
    setCarouselHasOverflow(maximumScroll > 2);
    setCarouselProgress(
      maximumScroll > 2 ? Math.min(1, Math.max(0, carousel.scrollLeft / maximumScroll)) : 0
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

  function resetCollection() {
    setSearch("");
    setFamily("All fragrances");
    setSort("curated");
  }

  return (
    <StorefrontLayout searchValue={search} onSearchChange={setSearch}>
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
                  Meet <strong>{featuredFragrance.name}</strong>, a{" "}
                  {featuredFragrance.family.toLowerCase()} fragrance made for the moments that become
                  memories.
                </>
              ) : catalogLoading ? (
                "Preparing the Vélora collection…"
              ) : (
                "The fragrance collection is temporarily unavailable."
              )}
            </p>
            {featuredFragrance && (
              <div className="hero-product-price">
                <span>
                  {featuredFragrance.family} · {featuredFragrance.volume}
                </span>
                <strong>{formatPrice(featuredFragrance.price)}</strong>
                <small
                  className={
                    featuredFragrance.stock <= featuredFragrance.reorderLevel ? "is-low-stock" : ""
                  }
                >
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
            <Link className="hero-collection-link" to="/catalog">
              Explore the collection <ArrowRight size={14} />
            </Link>
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
                <Link className="hero-art-note" to={`/product/${featuredFragrance.id}`}>
                  <span>AN ATELIER SIGNATURE</span>
                  <strong>{featuredFragrance.name}</strong>
                  <span>{featuredFragrance.family.toUpperCase()} · VIEW NOTES →</span>
                </Link>
              </>
            )}
            <div className="hero-art-caption">
              <span>CRAFTED TO LINGER</span>
            </div>
            {featuredFragrance && (
              <div className="hero-roundel">
                <span>
                  {featuredFragrance.volume.toUpperCase()}
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
                      <small>
                        0{index + 1} · {fragrance.family}
                      </small>
                      <strong>{fragrance.name}</strong>
                      <span>{formatPrice(fragrance.price)}</span>
                    </span>
                  </button>
                ))}
              </div>
              <Link className="hero-rail-link" to="/catalog">
                View all scents <ArrowRight size={13} />
              </Link>
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
            <div className="collection-sort-group">
              {search.trim() && (
                <button
                  type="button"
                  className="active-search-pill"
                  onClick={() => setSearch("")}
                  aria-label={`Clear search "${search.trim()}"`}
                >
                  <span>“{search.trim()}”</span>
                  <X size={12} aria-hidden="true" />
                </button>
              )}
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
                <ChevronDown size={14} aria-hidden="true" />
              </label>
            </div>
          </div>

          {catalogLoading ? (
            <div className="catalog-status" role="status">
              Loading the Vélora collection…
            </div>
          ) : catalogError ? (
            <div className="catalog-status catalog-status-error" role="alert">
              <p>{catalogError}</p>
              <button type="button" onClick={() => setCatalogReloadKey((key) => key + 1)}>
                Try again
              </button>
            </div>
          ) : visibleFragrances.length ? (
            <>
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
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
              {carouselHasOverflow && (
                <div className="carousel-progress" aria-hidden="true">
                  <span style={{ left: `${carouselProgress * 72}%` }} />
                </div>
              )}
            </>
          ) : (
            <div className="empty-search">
              <Search size={20} />
              <p>No fragrances match your current search and filters.</p>
              <button type="button" onClick={resetCollection}>
                Clear filters
              </button>
            </div>
          )}
          <div className="catalog-link-wrap">
            <div className="catalog-summary">
              <span aria-live="polite" aria-atomic="true">
                {visibleFragrances.length}{" "}
                {visibleFragrances.length === 1 ? "fragrance" : "fragrances"} in this collection
                {isFiltered ? ` (of ${fragrances.length})` : ""}
              </span>
              {isFiltered && (
                <button type="button" className="catalog-reset-link" onClick={resetCollection}>
                  Clear filters
                </button>
              )}
            </div>
            <Link className="collection-footer-cta" to="/catalog">
              <span>Browse full fragrance catalog</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
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
    </StorefrontLayout>
  );
}

export default function App() {
  return (
    <BagProvider>
      <Routes>
        <Route path="/" element={<StorefrontPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BagProvider>
  );
}
