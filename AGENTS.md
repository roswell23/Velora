# AGENTS.md — VÉLORA Development Guide

## 1. Project Overview & Scenario

- **Project Name:** VÉLORA
- **Tagline:** The Essence of Elegance.
- **Scenario:** A luxury perfume business operating an online storefront (E-Commerce) and an internal ERP portal (Sales, Inventory & Warehouse, Finance) backed by a single centralized PostgreSQL database.
- **Course Project:** System Integration and Architecture Group Project.
- **Team:** 5 members (2 E-Commerce, 3 ERP).
- **Architecture:** Client-Server, Modular Monolith, two frontends, one backend API, one PostgreSQL database.

---

## 2. Grading Rubric Summary

| Criteria                   | Points | Focus                                                      |
| -------------------------- | ------ | ---------------------------------------------------------- |
| System functionality       | 20     | Core features work reliably and are easy to use            |
| Integration & data sharing | 20     | At least 3 departments visibly share one database          |
| Database & architecture    | 15     | Clear ERD and architecture diagram matching code           |
| Documentation              | 15     | Complete diagrams, screenshots, testing results, decisions |
| Group demonstration        | 10     | Live end-to-end workflow demonstration                     |
| Individual performance     | 20     | Every member explains and executes their assigned module   |

**Priorities:**

1. Zero crashes during demo: robust, reliable, predictable code.
2. Code readability and explicability: prefer simple, readable code over clever abstractions.
3. Visible cross-departmental integration (Workflow 1 & 2).
4. Full alignment between specs, documentation, and code.

---

## 3. Fixed Technology Stack (JavaScript Only — No TypeScript)

- **Frontend:** React + Vite + JavaScript (JSX), Tailwind CSS, React Router, Lucide React.
- **Backend:** Node.js (ES modules: `"type": "module"`), Express.js, Zod validation.
- **Database & ORM:** PostgreSQL on Neon, Prisma ORM (`server/prisma/`).
- **Auth & Security:** JWT (8h expiration), Argon2id (`argon2`), `helmet`, `cors` (explicit origins allowlist), `express-rate-limit`.
- **Email:** Nodemailer (Ethereal test inbox in dev; console prints preview URL).
- **Testing:** Vitest + Supertest.
- **Tooling:** ESLint, Prettier, npm workspaces, Git/GitHub.
- **Strict JavaScript Rules:**
  - ES modules with `import`/`export`.
  - `const`/`let` only; `async`/`await` for asynchronous control flow.
  - File extensions: `.jsx` for React components, `.js` for everything else.
  - No `tsconfig`, no compilation step, no `types/` directories.
  - Zod schemas act as runtime single source of truth for request shapes.
  - JSDoc annotations allowed for service documentation.
  - Backend runs with `node --watch src/server.js`.
  - Prisma seed runs with `node prisma/seed.js`.

---

## 4. Project Structure

```text
velora/
├── client/
│   ├── customer/                (E-Commerce: React + Vite + Tailwind)
│   │   └── src/ components, layouts, features/{catalog,cart,auth,checkout,orders,profile},
│   │            services, hooks, utils, App.jsx, main.jsx
│   └── admin/                   (ERP portal: React + Vite + Tailwind)
│       └── src/ components, layouts, features/{auth,admin,sales,inventory,finance},
│                services, hooks, utils, App.jsx, main.jsx
├── server/
│   ├── prisma/ (schema.prisma, migrations/, seed.js)
│   └── src/
│       ├── config/              (env, permissions.js)
│       ├── middleware/          (auth, requireRole, validate, errorHandler)
│       ├── modules/             (auth, users, customers, categories, products, orders,
│       │                         my, inventory, payments, finance)
│       ├── utils/
│       ├── app.js
│       └── server.js
├── specs/                       (foundation, ecommerce-catalog, ecommerce-account-checkout,
│                                 erp-sales, erp-inventory, erp-finance)
├── docs/                        (01..06, api/, database/, screenshots/, decisions.md,
│                                 demo-script.md, traceability.md)
├── tests/                       (or server/tests)
├── AGENTS.md  README.md  CHANGELOG.md  package.json
├── server/.env.example
```

---

## 5. Naming Conventions

- **Folders:** kebab-case (e.g., `ecommerce-catalog`, `features/catalog`).
- **React Components:** PascalCase (e.g., `ProductCard.jsx`, `OrderTracker.jsx`).
- **Utility / Service files:** camelCase (e.g., `apiClient.js`, `formatCurrency.js`).
- **Database Tables & Models:** PascalCase in Prisma (`Product`, `OrderItem`, `StockMovement`).
- **Database Columns / Fields:** camelCase in Prisma (`unitPrice`, `paymentStatus`, `orderNumber`).
- **API Routes:** kebab-case nouns pluralized (e.g., `/api/products`, `/api/orders`, `/api/stock-movements`).

---

## 6. Permission Matrix

Roles: `CUSTOMER`, `ADMIN`, `SALES`, `INVENTORY`, `FINANCE`.

| Capability                               |    CUSTOMER    | ADMIN | SALES | INVENTORY | FINANCE |
| ---------------------------------------- | :------------: | :---: | :---: | :-------: | :-----: |
| Browse products (public, no login)       |      Yes       |  Yes  |  Yes  |    Yes    |   Yes   |
| Place order, view own orders and profile | Yes (own only) |  No   |  No   |    No     |   No    |
| Cancel own order (only while PENDING)    |      Yes       |  No   |  No   |    No     |   No    |
| Manage users (staff)                     |       No       |  Yes  |  No   |    No     |   No    |
| Customers: create, view, update, search  |       No       |  Yes  |  Yes  |   View    |  View   |
| Orders: view and search (all)            |       No       |  Yes  |  Yes  |    Yes    |   Yes   |
| Orders: create for a walk-in customer    |       No       |  Yes  |  Yes  |    No     |   No    |
| Orders: cancel (only while PENDING)      |       No       |  Yes  |  Yes  |    No     |   No    |
| Orders: fulfill (deduct stock)           |       No       |  Yes  |  No   |    Yes    |   No    |
| Products and categories: create, update  |       No       |  Yes  |  No   |    Yes    |   No    |
| Stock-in, stock adjustment               |       No       |  Yes  |  No   |    Yes    |   No    |
| Stock movement history                   |       No       |  Yes  |  No   |    Yes    |  View   |
| Record payment for an order              |       No       |  Yes  |  No   |    No     |   Yes   |
| View payments and finance summary        |       No       |  Yes  |  No   |    No     |   Yes   |

_Rules:_

- Check authorization **on the backend** in middleware; UI menu hiding is purely for user experience.
- Customer endpoints enforce ownership check on `req.user.id == target.userId`.
- Defined once in `server/src/config/permissions.js`.

---

## 7. Required Workflows

### Workflow 1: Online Order to Payment (E-Commerce → Sales → Inventory → Finance)

1. **E-Commerce:** Customer registers/logs in, adds products to cart, and checks out with COD. Backend validates stock and prices, creates order (`PENDING`, `UNPAID`, `ONLINE`). Customer tracks order.
2. **Sales:** Order appears in ERP Sales order list (`ONLINE` filter) with customer details.
3. **Inventory:** Order appears in "Orders to fulfill". In a single transaction: stock deducted, `SALE` stock movement recorded, status updated to `FULFILLED`. Fails if insufficient stock.
4. **E-Commerce:** Customer order tracker reflects `Fulfilled`.
5. **Finance:** Order appears in unpaid fulfilled list. Finance records COD payment. Order `paymentStatus` becomes `PAID`, revenue updates.

### Workflow 2: Restock and Cost Visibility (Inventory → E-Commerce, Sales, Finance)

1. Product reaches reorder level (`stock <= reorderLevel`) in Inventory low-stock view.
2. **Inventory:** Records stock-in (quantity, unit cost). In a single transaction: stock increases, `STOCK_IN` movement logged.
3. **E-Commerce & Sales:** Product stock reflects updated quantity in catalog and walk-in order creation.
4. **Finance:** Inventory purchase cost updates on Finance dashboard.

---

## 8. Out of Scope (Do NOT Build)

- Online payment gateways (PayMongo, GCash, Stripe); COD only.
- Refresh tokens / token rotation; any emails besides password reset.
- Image uploads / Cloudinary (image URLs stored as text strings).
- Server-side persistent cart table (cart lives in client `localStorage`).
- Multiple warehouses, stock transfers, auto-expiry jobs.
- Refunds, tax calculation engines, shipping fee calculators, coupons, discounts, wishlists, reviews.
- Real-time WebSockets / push notifications / heavy chart libraries.
- Browser E2E automation frameworks.

---

## 9. Spec-Driven Development (SDD) Rules & Spec Format

- **The Golden Rule:** No feature code without an Approved spec.
- **Spec Template:**
  ```markdown
  # Spec: <module name>

  Owner: <member> Status: Draft | Approved Version: 0.1

  ## 1. Purpose

  ## 2. Roles and permissions

  ## 3. Requirements (Table: ID, Requirement, Priority)

  ## 4. Data used (tables and fields, read vs write)

  ## 5. API endpoints (method, path, role, request, response, errors)

  ## 6. UI pages and behavior (pages, fields, validations, empty/error states)

  ## 7. Business rules and validations

  ## 8. Acceptance criteria (Given / When / Then)

  ## 9. Test cases (ID, steps, expected result)

  ## 10. Dependencies on other modules
  ```
- **Requirement ID Prefixes:**
  - `AUTH`: Authentication and Authorization
  - `ECA`: E-Commerce Catalog & Cart
  - `ECB`: E-Commerce Account, Checkout & Orders
  - `SAL`: ERP Sales
  - `INV`: ERP Inventory & Warehouse
  - `FIN`: ERP Finance
  - `ADM`: Admin User Management

---

## 10. Testing Rules

- Automated tests using Vitest + Supertest for backend API.
- Test coverage must include:
  - Customer & staff authentication (success and failure modes).
  - Forgot/reset password flow (generic responses, token expiration, single-use check).
  - Role-based authorization (403 for unauthorized roles).
  - Customer ownership isolation (cannot access other customers' orders/profile).
  - Order checkout calculation and insufficient stock rejection.
  - Order fulfillment stock deduction and atomicity rollback.
  - Stock non-negativity constraint.
  - Payment recording only on fulfilled orders, and revenue updates.

---

## 11. Security Basics

- **Passwords:** Argon2id with recommended parameters (`memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`). Minimum 8 characters.
- **JWT:** Signed with `JWT_SECRET`, 8h expiration. Generic login errors ("Invalid email or password").
- **Password Reset:** Single-use random tokens; only SHA-256 hash stored in DB; 30-minute expiration. Generic response regardless of email existence.
- **Network & Headers:** `helmet` for HTTP security headers, `cors` restricted strictly to `CUSTOMER_ORIGIN` and `ADMIN_ORIGIN`.
- **Rate Limiting:** `express-rate-limit` on `/api/auth/login`, `/api/auth/staff-login`, and `/api/auth/forgot-password`.
- **Validation:** Zod schemas applied to request body, query params, and route params.
- **Data Protection:** Never commit `.env` or API credentials to Git.

---

## 12. Database Rules

- Centralized PostgreSQL hosted on Neon.
- Monetary values must use `Decimal`; no JavaScript floating point math for prices, subtotals, or totals.
- Enforce `stock >= 0` via database `CHECK` constraint and application logic.
- Every stock alteration must log an immutable `StockMovement` row.
- Transactions (`prisma.$transaction`) are mandatory for: order creation, fulfillment, and stock adjustments/restocks.
- Backend recalculates all order totals from current `Product.unitPrice` at checkout.

---

## 13. API Conventions

- Standard JSON envelope:
  - Success: `{ "success": true, "data": ..., "meta": ... }`
  - Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": ... } }`
- HTTP Status Codes:
  - `200 OK`, `201 Created`
  - `400 Bad Request` (Zod validation failure)
  - `401 Unauthorized` (Missing or invalid token)
  - `403 Forbidden` (Insufficient role or ownership violation)
  - `404 Not Found` (Resource does not exist)
  - `409 Conflict` (Duplicate unique field, e.g., email or SKU)
  - `500 Internal Server Error`
- Pagination metadata: `{ page, limit, total, totalPages }`.
- All endpoints must be documented in `docs/api/` prior to frontend consumption.

---

## 14. Git Workflow & Collaboration

- Branches: `main`, `development`, `feature/<module-name>`.
- Commit messages must be descriptive and reference spec requirement IDs where applicable.
- Pull requests for shared files (`schema.prisma`, `permissions.js`, shared UI components) require teammate review.
- Contributions documented in `docs/06-contributions.md`.

---

## 15. Definition of Done (Per Feature)

1. Spec is marked **Approved** and all acceptance criteria are satisfied.
2. ESLint passes with zero warnings or errors (`no-unused-vars`, `no-undef`, `eqeqeq`, `prefer-const`).
3. Automated backend tests pass.
4. Backend role authorization verified (403 for unauthorized roles).
5. Input validated with Zod; endpoint documented in `docs/api/`.
6. Atomic transactions used for state-altering multi-step operations.
7. Requirement mapped in `docs/traceability.md`.
8. UI loading, empty, and error states handled gracefully.
9. Module owner can clearly explain every line of code.
