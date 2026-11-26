import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import StorefrontLayout from "../../components/StorefrontLayout.jsx";
import ProductCard from "../../components/ProductCard.jsx";
import { mapProduct } from "../../components/BottleArt.jsx";
import { useBag } from "../../hooks/useBag.jsx";
import { api } from "../../services/apiClient.js";

const PAGE_SIZE = 9;

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { syncBagWithProducts } = useBag();

  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSort = searchParams.get("sort") || "newest";
  const initialMin = searchParams.get("minPrice") || "";
  const initialMax = searchParams.get("maxPrice") || "";
  const initialPage = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [minPrice, setMinPrice] = useState(initialMin);
  const [maxPrice, setMaxPrice] = useState(initialMax);
  const [page, setPage] = useState(initialPage);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch) nextParams.set("search", debouncedSearch);
    if (categoryId) nextParams.set("category", categoryId);
    if (sort !== "newest") nextParams.set("sort", sort);
    if (minPrice.trim()) nextParams.set("minPrice", minPrice.trim());
    if (maxPrice.trim()) nextParams.set("maxPrice", maxPrice.trim());
    if (page > 1) nextParams.set("page", String(page));
    setSearchParams(nextParams, { replace: true });
  }, [debouncedSearch, categoryId, sort, minPrice, maxPrice, page, setSearchParams]);

  useEffect(() => {
    let ignore = false;
    api
      .get("/categories")
      .then((response) => {
        if (!ignore && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort,
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryId) params.set("categoryId", categoryId);
    if (minPrice.trim() !== "" && !Number.isNaN(Number(minPrice))) {
      params.set("minPrice", minPrice.trim());
    }
    if (maxPrice.trim() !== "" && !Number.isNaN(Number(maxPrice))) {
      params.set("maxPrice", maxPrice.trim());
    }

    api
      .get(`/products?${params.toString()}`)
      .then((response) => {
        if (ignore) return;
        const mapped = response.data.map((item, idx) => mapProduct(item, idx));
        setProducts(mapped);
        setMeta(
          response.meta || {
            page,
            limit: PAGE_SIZE,
            total: mapped.length,
            totalPages: 1,
          }
        );
        syncBagWithProducts(mapped);
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Could not load the fragrance catalog.");
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
  }, [debouncedSearch, categoryId, sort, minPrice, maxPrice, page, reloadKey, syncBagWithProducts]);

  const hasActiveFilters = Boolean(
    debouncedSearch || categoryId || minPrice.trim() || maxPrice.trim() || sort !== "newest"
  );

  function handleSearchChange(value) {
    setSearchInput(value);
    setPage(1);
  }

  function handleCategoryChange(nextId) {
    setCategoryId(nextId);
    setPage(1);
  }

  function handleSortChange(nextSort) {
    setSort(nextSort);
    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  }

  const totalPages = Math.max(1, meta.totalPages || 1);

  return (
    <StorefrontLayout
      searchValue={searchInput}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search"
    >
      <main className="catalog-page">
        <div className="catalog-page-header">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Fragrances</span>
          </nav>
          <div className="catalog-hero-row">
            <div>
              <p className="eyebrow">THE VÉLORA CATALOG</p>
              <h1>
                Every fragrance, <em>in full.</em>
              </h1>
            </div>
            <p className="catalog-hero-aside">
              Browse our complete house collection by olfactory family, price, or signature notes.
            </p>
          </div>
        </div>

        <section className="catalog-toolbar" aria-label="Filter and sort fragrances">
          <div className="catalog-search-row">
            <label className="catalog-search-box">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search by fragrance name, brand, or SKU</span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search by fragrance, brand, or SKU…"
              />
              {searchInput && (
                <button
                  type="button"
                  className="catalog-search-clear"
                  onClick={() => handleSearchChange("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="catalog-price-filters">
              <SlidersHorizontal size={14} aria-hidden="true" />
              <label className="price-field">
                <span className="sr-only">Minimum price</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={minPrice}
                  onChange={(event) => {
                    setMinPrice(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Min $"
                />
              </label>
              <span className="price-sep" aria-hidden="true">
                –
              </span>
              <label className="price-field">
                <span className="sr-only">Maximum price</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={maxPrice}
                  onChange={(event) => {
                    setMaxPrice(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Max $"
                />
              </label>
            </div>

            <label className="sort-select-wrap catalog-sort-select">
              <span className="sr-only">Sort fragrances</span>
              <select
                className="sort-select"
                value={sort}
                onChange={(event) => handleSortChange(event.target.value)}
              >
                <option value="newest">Newest arrivals</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
          </div>

          <div className="catalog-category-bar">
            <div className="family-tabs" role="group" aria-label="Filter by category">
              <button
                type="button"
                className={categoryId === "" ? "family-tab active" : "family-tab"}
                aria-pressed={categoryId === ""}
                onClick={() => handleCategoryChange("")}
              >
                All fragrances
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={String(cat.id) === categoryId ? "family-tab active" : "family-tab"}
                  aria-pressed={String(cat.id) === categoryId}
                  onClick={() => handleCategoryChange(String(cat.id))}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="catalog-meta-status">
              <span aria-live="polite" aria-atomic="true">
                {loading
                  ? "Updating collection…"
                  : `${meta.total} ${meta.total === 1 ? "fragrance" : "fragrances"}`}
              </span>
              {hasActiveFilters && (
                <button type="button" className="catalog-reset-link" onClick={clearFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="catalog-status" role="status">
            Loading the Vélora catalog…
          </div>
        ) : error ? (
          <div className="catalog-status catalog-status-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </button>
          </div>
        ) : products.length ? (
          <>
            <div className="catalog-grid" role="list" aria-label="Catalog fragrances">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} showBadge={false} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="catalog-pagination" aria-label="Catalog pagination">
                <button
                  type="button"
                  className="pagination-arrow"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                  <span>Previous</span>
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={pageNum === page ? "pagination-page is-current" : "pagination-page"}
                      aria-current={pageNum === page ? "page" : undefined}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="pagination-arrow"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>Next</span>
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="empty-search">
            <Search size={20} />
            <p>No fragrances match your current search and price filters.</p>
            <button type="button" onClick={clearFilters}>
              Clear all filters
            </button>
          </div>
        )}
      </main>
    </StorefrontLayout>
  );
}
