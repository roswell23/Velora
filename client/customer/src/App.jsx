import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";

const fragrances = [
  {
    id: 1,
    name: "Santal Royale",
    family: "Woody",
    size: "100 ml · Eau de parfum",
    price: 185,
    stock: 10,
    label: "SIGNATURE",
    tone: "sand",
  },
  {
    id: 2,
    name: "Fleur de Soie",
    family: "Floral",
    size: "75 ml · Eau de parfum",
    price: 162,
    stock: 2,
    label: "ATELIER EDIT",
    tone: "rose",
  },
  {
    id: 3,
    name: "Ambre Nocturne",
    family: "Oriental",
    size: "100 ml · Eau de parfum",
    price: 198,
    stock: 7,
    label: "NEW ARRIVAL",
    tone: "amber",
  },
  {
    id: 4,
    name: "Neroli d'Été",
    family: "Citrus",
    size: "50 ml · Eau de parfum",
    price: 128,
    stock: 5,
    label: "",
    tone: "cream",
  },
];

const families = ["All fragrances", "Woody", "Floral", "Oriental", "Citrus"];

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
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

export default function App() {
  const [family, setFamily] = useState("All fragrances");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("curated");
  const [bag, setBag] = useState(() => {
    try {
      const storedBag = JSON.parse(localStorage.getItem("velora_boutique_bag") || "[]");
      return Array.isArray(storedBag) ? storedBag : [];
    } catch {
      return [];
    }
  });
  const [bagOpen, setBagOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState([]);

  const visibleFragrances = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = fragrances.filter((item) => {
      const matchesFamily = family === "All fragrances" || item.family === family;
      const matchesSearch = !term || `${item.name} ${item.family}`.toLowerCase().includes(term);
      return matchesFamily && matchesSearch;
    });
    if (sort === "price-low") return filtered.sort((a, b) => a.price - b.price);
    if (sort === "price-high") return filtered.sort((a, b) => b.price - a.price);
    return filtered;
  }, [family, search, sort]);

  useEffect(() => {
    localStorage.setItem("velora_boutique_bag", JSON.stringify(bag));
  }, [bag]);

  const bagCount = bag.reduce((total, item) => total + item.quantity, 0);
  const bagTotal = bag.reduce((total, item) => total + item.price * item.quantity, 0);

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
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <a className="wordmark" href="#top" aria-label="Vélora home">
          VÉLORA<span>®</span>
        </a>
        <nav className={`store-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
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
          <button
            type="button"
            className="bag-trigger"
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
              <span /> THE ART OF ARRIVING
            </p>
            <h1>
              Leave a little
              <br />
              <em>of yourself</em>
              <br />
              in the air.
            </h1>
            <p className="hero-description">
              Considered fragrances for the moments that become memories. Made slowly, worn
              instinctively.
            </p>
            <a className="button button-dark" href="#collection">
              Discover the collection <ArrowRight size={16} />
            </a>
            <div className="hero-footnote">
              <span className="hero-index">01 / 04</span>
              <span className="hero-line" />
              <span>SCENT, WITH INTENTION</span>
            </div>
          </div>
          <div className="hero-art" aria-label="A perfume bottle in warm afternoon light">
            <div className="hero-art-wash" />
            <BottleArt name="Santal Royale" tone="sand" large />
            <div className="hero-art-caption">
              <span>01 — SIGNATURE</span>
              <strong>Santal Royale</strong>
              <span>CEDAR · AMBER · FIG</span>
            </div>
            <div className="hero-roundel">
              <span>
                EAU
                <br />
                DE
                <br />
                PARFUM
              </span>
            </div>
          </div>
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

        <section className="collection-section" id="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE VÉLORA COLLECTION</p>
              <h2>
                Find your <em>almost indescribable.</em>
              </h2>
            </div>
            <p className="section-aside">A study in feeling, bottled.</p>
          </div>

          <div className="collection-controls">
            <div className="family-tabs" role="group" aria-label="Filter by fragrance family">
              {families.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={family === item ? "family-tab active" : "family-tab"}
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

          {visibleFragrances.length ? (
            <div className="product-grid">
              {visibleFragrances.map((product, index) => (
                <article className="product-card" key={product.id}>
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
                  <p className={`stock-note ${product.stock <= 3 ? "stock-note-low" : ""}`}>
                    <i />{" "}
                    {product.stock === 0
                      ? "Out of stock"
                      : product.stock <= 3
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
              <p>No fragrances found for “{search}”.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFamily("All fragrances");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          <div className="catalog-link-wrap">
            <span>{visibleFragrances.length} fragrances in this edit</span>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFamily("All fragrances");
              }}
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
          <aside className="bag-drawer" aria-label="Shopping bag">
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">YOUR SELECTION</p>
                <h2>
                  The fragrance bag <span>({bagCount})</span>
                </h2>
              </div>
              <button
                className="icon-button"
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
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label={`Remove one ${item.name}`}
                          >
                            <Minus size={13} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
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
                    <strong>{formatPrice(bagTotal)}</strong>
                  </div>
                  <p>
                    <Check size={14} /> Preview bag · quantities saved on this device
                  </p>
                  <button
                    className="button button-dark drawer-continue"
                    onClick={() => setBagOpen(false)}
                  >
                    Continue exploring <ArrowRight size={15} />
                  </button>
                  <small>Preview bag · Checkout will be available soon</small>
                </div>
              </>
            ) : (
              <div className="empty-bag">
                <ShoppingBag size={26} strokeWidth={1.2} />
                <h3>A little room for something lovely.</h3>
                <p>Your bag is waiting for its first fragrance.</p>
                <button className="text-link" onClick={() => setBagOpen(false)}>
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
