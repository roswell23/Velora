<div align="center">

# VÉLORA

**The Essence of Elegance.**

Customer fragrance boutique and ERP workspace, connected through one shared PostgreSQL database.

<p>
  <a href="#1-system-architecture-overview">Architecture</a> •
  <a href="#3-technology-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-testing--verification">Verification</a> •
  <a href="#-spec-driven-development-workflow">Specifications</a>
</p>

</div>

---

## 1. System Architecture & Overview

VÉLORA is developed as a modular client-server system for the System Integration and Architecture course project.

```text
               ┌────────────────────────┐       ┌──────────────────────┐
               │    Customer Portal     │       │      ERP Portal      │
               │   (client/customer)    │       │    (client/admin)    │
               │  React + Vite + TW     │       │  React + Vite + TW   │
               └───────────┬────────────┘       └──────────┬───────────┘
                           │                               │
                           │  HTTP / REST (JSON)           │
                           ▼                               ▼
               ┌───────────────────────────────────────────────────────┐
               │                  Express.js Backend                   │
               │                       (server)                        │
               └───────────────────────────┬───────────────────────────┘
                                           │ Prisma ORM
                                           ▼
               ┌───────────────────────────────────────────────────────┐
               │              Neon PostgreSQL Database                 │
               │            (Shared Centralized Schema)                │
               └───────────────────────────────────────────────────────┘
```

---

## 2. Project Modules & Team Ownership

| Member   | Area          | Scope                     | Key Deliverables                                             |
| -------- | ------------- | ------------------------- | ------------------------------------------------------------ |
| Member 1 | E-Commerce A  | Customer Storefront       | Product catalog, filters, search, product detail, cart       |
| Member 2 | E-Commerce B  | Customer Account & Orders | Registration, customer login, checkout (COD), order tracking |
| Member 3 | ERP Sales     | Sales Management          | Customer database, internal order creation, sales pipeline   |
| Member 4 | ERP Inventory | Inventory & Warehouse     | Product catalog management, stock-in, order fulfillment      |
| Member 5 | ERP Finance   | Financial Control         | COD payment recording, revenue reports, purchase costs       |

---

## 3. Technology Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React, React Router
- **Backend:** Node.js (ES modules), Express.js, Zod
- **Database & ORM:** PostgreSQL (Neon), Prisma ORM
- **Auth & Security:** JWT, Argon2id, Helmet, CORS, Express Rate Limit
- **Testing:** Vitest, Supertest

---

## 🚀 Getting Started

Follow these steps to run the VÉLORA storefront, ERP portal, and backend locally.

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- npm v10 or later
- A PostgreSQL database. [Neon](https://neon.tech/) is recommended; local PostgreSQL also works.
- A database connection with permission to create or update the project tables.

---

### 1. Clone the Repository

```bash
# Replace the placeholder with your team's repository URL
git clone <your-repository-url> Velora
cd Velora
npm install
```

`npm install` at the repository root installs dependencies for all workspaces.

---

### 2. Configure the Backend (`server/`)

Create the backend environment file from the repository root.

**PowerShell:**

```powershell
Copy-Item server/.env.example server/.env
```

**macOS / Linux:**

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set:

```env
DATABASE_URL="<pooled PostgreSQL connection string>"
DIRECT_URL="<direct PostgreSQL connection string>"
JWT_SECRET="<private random secret, at least 32 characters>"
```

For Neon, use its pooled URL for `DATABASE_URL` and direct, non-pooled URL for `DIRECT_URL`. For local PostgreSQL, both can use the same URL. Keep `server/.env` private and out of Git.

---

### 3. Prepare the Database and Load Demo Data

From the repository root, run Prisma from the server directory:

```bash
cd server
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..
```

`prisma db push` creates or updates tables from `server/prisma/schema.prisma`. This checkout does not contain migration files. The seed script creates demo accounts, customers, categories, products, orders, payments, and stock movements. You can rerun it to restore missing demo records.

---

### 4. Configure the Frontends (Optional)

Both frontend apps use `http://localhost:5000/api` by default. To change the API URL, create `.env` in `client/customer/` or `client/admin/` and add:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

No frontend environment file is needed for the default local setup.

---

### 5. Start the Applications

Open three terminals in the repository root and run one command in each.

**Terminal 1 — Backend API** (`http://localhost:5000`):

```bash
npm run dev:server
```

**Terminal 2 — Customer storefront** (`http://localhost:5173`):

```bash
npm run dev:customer
```

**Terminal 3 — ERP portal** (`http://localhost:5174`):

```bash
npm run dev:admin
```

Check the API at `http://localhost:5000/api/health`. Open the storefront at `http://localhost:5173` and the ERP sign-in at `http://localhost:5174/login`.

---

### 6. Sign In with a Demo Staff Account

The seed script sets `DemoPass123!` as the password for each demo account.

| Role      | Email                    | Password       |
| --------- | ------------------------ | -------------- |
| ADMIN     | `admin@velora.local`     | `DemoPass123!` |
| SALES     | `sales@velora.local`     | `DemoPass123!` |
| INVENTORY | `inventory@velora.local` | `DemoPass123!` |
| FINANCE   | `finance@velora.local`   | `DemoPass123!` |

The seed also creates `customer@velora.local` with the same password. Customer account screens are not part of the storefront preview yet.

> **Current scaffold status:** The storefront catalog and bag use local preview data. ERP department pages show preview layouts and sample rows. The backend currently mounts health, authentication, and staff-user routes; catalog, sales, inventory, and finance screens are not connected to live API data yet.

## 🧪 Testing & Verification

Run these commands from the repository root:

```bash
npm run lint
npm test
npm run format:check
```

Build the frontend workspaces for production:

```bash
npm run build --workspace=client/customer
npm run build --workspace=client/admin
```

## 📘 Spec-Driven Development Workflow

This project strictly enforces **Spec-Driven Development (SDD)**:

1. **Phase 1: Project Setup** (scaffolding, configuration, linting, health check)
2. **Phase 2: Specification** (System architecture, ERD, API specs, module specs, traceability)
3. **Phase 3: Implementation by Vertical Slice** (Spec → Tests → Code)
4. **Phase 4: Verification & Documentation** (Automated & manual testing, demo rehearsal)
