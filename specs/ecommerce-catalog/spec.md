# Spec: E-Commerce A — Catalog & Cart

Owner: Member 1 Status: Approved Version: 1.0

## 1. Purpose

Deliver a responsive, luxury storefront experience for retail perfume customers: brand hero landing page, searchable and filterable fragrance catalog, detailed product view with olfactory notes and stock indicators, and client-side shopping cart with stock quantity bounds.

## 2. Roles and Permissions

- **Public / Unauthenticated:** Browse catalog, search, filter, view product details, manage shopping cart in `localStorage`.
- **`CUSTOMER`:** Full catalog browsing, cart operations.
- **Staff Roles:** Public read access to `/api/products` and `/api/categories`.

## 3. Requirements

| ID     | Requirement                                                                                                                                             | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| ECA-01 | Home page showcases brand story, curated featured perfumes, and new arrivals.                                                                           | Must     |
| ECA-02 | Catalog page displays active products with keyword search matching name or brand.                                                                       | Must     |
| ECA-03 | Catalog allows filtering by fragrance category (Woody, Floral, Oriental, etc.) and price range.                                                         | Must     |
| ECA-04 | Catalog supports sorting by price (ascending, descending) and date added (newest).                                                                      | Must     |
| ECA-05 | Catalog supports paginated browsing with page indicator and total item count.                                                                           | Must     |
| ECA-06 | Product detail page displays high-resolution image URL, perfume name, brand, description, volume (e.g. 100ml), retail price, and real-time stock badge. | Must     |
| ECA-07 | Product stock badge displays: "In Stock" (stock > reorderLevel), "Low Stock" (1 <= stock <= reorderLevel), or "Out of Stock" (stock = 0).               | Must     |
| ECA-08 | Add to Cart is disabled when product stock equals 0.                                                                                                    | Must     |
| ECA-09 | Shopping cart persisted in browser `localStorage`: add item, remove item, modify quantity, compute line subtotals and overall cart total.               | Must     |
| ECA-10 | Cart quantity selector prevents incrementing beyond available product stock.                                                                            | Must     |

## 4. Data Used

| Table      | Fields Read                                                                                                                     | Fields Written | Notes                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------- |
| `Product`  | `id`, `categoryId`, `sku`, `name`, `brand`, `description`, `imageUrl`, `size`, `unitPrice`, `stock`, `reorderLevel`, `isActive` | None           | Read-only from public API; only active products displayed |
| `Category` | `id`, `name`, `description`                                                                                                     | None           | Read-only category definitions                            |

## 5. API Endpoints

- `GET /api/categories` — Public; retrieves all categories.
- `GET /api/products` — Public; queries products with parameters `search`, `categoryId`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`. Excludes inactive products for public shoppers.
- `GET /api/products/:id` — Public; retrieves single product details.

## 6. UI Pages and Behavior

- **Home Page (`/`):**
  - Luxury hero section with brand typography.
  - Featured products grid and direct link to full catalog.
- **Catalog Page (`/catalog`):**
  - Search bar with debounce.
  - Category filter pills / sidebar.
  - Price range slider / min-max inputs.
  - Sort dropdown (`Newest`, `Price: Low to High`, `Price: High to Low`).
  - Responsive product cards showing image, brand, name, volume, price, stock badge.
  - Empty state when search yields no products.
- **Product Detail Page (`/product/:id`):**
  - Image gallery card.
  - Fragrance description & notes.
  - Quantity picker (bounded by available stock).
  - "Add to Bag" primary button with instantaneous feedback.
- **Cart Slide-Over / Page (`/cart`):**
  - List of items with thumbnail, title, unit price, quantity increment/decrement, remove button.
  - Subtotal computation.
  - "Proceed to Checkout" button linking to E-Commerce B checkout flow.

## 7. Business Rules and Validations

- Customer catalog views only display products where `isActive === true`.
- Stock badge logic:
  - If `stock === 0`: `OUT_OF_STOCK` (Badge: Red/Muted, button disabled).
  - If `stock <= reorderLevel`: `LOW_STOCK` (Badge: Amber, "Only X bottles remaining").
  - Else: `IN_STOCK` (Badge: Subtle gold/green, "In Stock").
- Frontend cart re-verifies stock availability during checkout via backend recomputation.

## 8. Acceptance Criteria

- **Scenario:** Catalog Filtering
  - Given active products in Woody and Floral categories, When customer filters by "Woody", Then only Woody perfumes are rendered [ECA-02, ECA-03].
- **Scenario:** Low Stock Indicator
  - Given a perfume with `stock = 3` and `reorderLevel = 5`, When customer views product details, Then badge displays "Low Stock" [ECA-07].
- **Scenario:** Out of Stock Prevention
  - Given a perfume with `stock = 0`, When viewing product details, Then Add to Cart button is disabled and shows "Out of Stock" [ECA-07, ECA-08].
- **Scenario:** Cart Storage Persistence
  - Given items added to cart, When customer refreshes the browser, Then cart items, quantities, and totals remain intact from `localStorage` [ECA-09].

## 9. Test Cases

- `TC-ECA-01`: Query public products without filters -> Returns active products with pagination metadata.
- `TC-ECA-02`: Query products with `categoryId` -> Returns only matching category products.
- `TC-ECA-03`: Fetch single product by id -> Returns complete product detail and category object.
- `TC-ECA-04`: Attempt to fetch inactive product -> 404 Not Found.

## 10. Dependencies on Other Modules

- Consumes product and category catalog maintained by ERP Inventory (Member 4).
- Hands off cart state to E-Commerce B Checkout (Member 2).
