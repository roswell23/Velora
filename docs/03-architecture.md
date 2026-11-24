# 03 — Architecture & System Design

## 1. System Overview

VÉLORA is architected as a Client-Server Modular Monolith. The system integrates two frontends with a single unified backend API and one centralized PostgreSQL database hosted on Neon.

- **E-Commerce Customer Storefront (`client/customer`):** Public-facing portal for customers to browse luxury fragrances, manage their shopping carts, authenticate, checkout using Cash on Delivery (COD), and track order progress.
- **ERP Staff Portal (`client/admin`):** Role-gated internal operational portal serving four departments: Sales, Inventory & Warehouse, Finance, and Administration.
- **Backend API (`server`):** Node.js and Express.js REST API providing modular endpoints, JWT authentication, role authorization, Zod schema validation, and atomic transaction handling.
- **Database Layer (Neon PostgreSQL):** Single centralized relational database with pooled runtime connections and direct migration connections.

---

## 2. High-Level System Architecture Diagram

```mermaid
graph TD
    subgraph PresentationLayer["Presentation Layer (React + Vite + Tailwind CSS)"]
        CustomerUI["Customer Storefront<br/>(client/customer)<br/>Port: 5173"]
        AdminUI["ERP Staff Portal<br/>(client/admin)<br/>Port: 5174"]
    end

    subgraph SecurityLayer["Security & Gateway (server)"]
        CORS["CORS Allowlist<br/>(5173 & 5174 only)"]
        Helmet["Helmet Security Headers"]
        RateLimit["Rate Limiter<br/>(auth & password reset)"]
    end

    subgraph AppLayer["Application Layer (Express.js Modular Monolith)"]
        Router["REST API Router (/api)"]
        AuthMiddleware["Auth & Ownership Guard<br/>(JWT & req.user)"]
        RoleGuard["Role-Based Middleware<br/>(permissions.js)"]
        ZodValidator["Zod Schema Validation"]

        subgraph Modules["Domain Modules"]
            AuthMod["Auth & User Mgmt"]
            CustomerMod["Customer Mgmt"]
            CatalogMod["Product & Category Catalog"]
            OrderMod["Orders & Checkout Engine"]
            InventoryMod["Inventory & Stock Movements"]
            FinanceMod["Finance & Payment Reconciliation"]
        end

        PrismaClient["Prisma ORM Client<br/>(Transactions & Decimal Math)"]
    end

    subgraph DataLayer["Persistence Layer (PostgreSQL on Neon)"]
        SharedDB[("Centralized PostgreSQL Database<br/>~10 Relational Tables<br/>CHECK(stock >= 0)")]
    end

    CustomerUI -->|"HTTPS / REST (JSON)"| CORS
    AdminUI -->|"HTTPS / REST (JSON)"| CORS
    CORS --> Helmet --> RateLimit --> Router
    Router --> AuthMiddleware --> RoleGuard --> ZodValidator
    ZodValidator --> Modules
    Modules --> PrismaClient
    PrismaClient -->|"Pooled Connection (pgBouncer)"| SharedDB
```

---

## 3. Department-to-Department Data Flow Diagrams

### 3.1 Workflow 1: Online Order to Payment (E-Commerce → Sales → Inventory → Finance)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (E-Commerce)
    actor Sales as Sales Staff (ERP)
    actor Inventory as Inventory Staff (ERP)
    actor Finance as Finance Staff (ERP)
    participant API as Backend API (Express)
    participant DB as Neon PostgreSQL (Prisma)

    %% Step 1: E-Commerce
    Note over Customer,DB: Step 1: E-Commerce Order Placement
    Customer->>API: POST /api/my/orders (Items, Delivery Details, COD)
    API->>DB: Transaction: Validate stock, fetch unitPrice from DB, create Order(PENDING, UNPAID, ONLINE) + OrderItems
    DB-->>API: Order Created (#VEL-XXXX)
    API-->>Customer: 201 Created (Order Confirmation & Tracking link)

    %% Step 2: Sales Visibility
    Note over Sales,DB: Step 2: Sales Visibility
    Sales->>API: GET /api/orders?source=ONLINE&status=PENDING
    API->>DB: Query orders where source=ONLINE
    DB-->>API: List of orders with customer contact & total
    API-->>Sales: 200 OK (Order visible in ERP Sales dashboard)

    %% Step 3: Inventory Fulfillment
    Note over Inventory,DB: Step 3: Inventory Fulfillment & Stock Deduction
    Inventory->>API: POST /api/orders/:id/fulfill
    API->>DB: Transaction: Re-check stock >= quantity, deduct Product.stock, create StockMovement(SALE, -qty), set Order status=FULFILLED
    DB-->>API: Transaction Committed
    API-->>Inventory: 200 OK (Order Fulfilled)

    %% Step 4: Customer Status Reflection
    Note over Customer,DB: Step 4: Customer Order Tracker Update
    Customer->>API: GET /api/my/orders/:id
    API->>DB: Query order by id + ownership check (userId)
    DB-->>API: Order status = FULFILLED
    API-->>Customer: 200 OK (Status Tracker displays "Fulfilled")

    %% Step 5: Finance COD Collection
    Note over Finance,DB: Step 5: Finance Payment Recording & Revenue Update
    Finance->>API: POST /api/payments (orderId, amount=total, method=CASH, refNo)
    API->>DB: Transaction: Validate status=FULFILLED & UNPAID, create Payment record, set Order paymentStatus=PAID
    DB-->>API: Payment Saved, Order marked PAID
    API-->>Finance: 201 Created (Payment receipt recorded)
    Finance->>API: GET /api/finance/dashboard
    API->>DB: Aggregate SUM(total) from orders where paymentStatus=PAID
    DB-->>API: Aggregated Revenue
    API-->>Finance: 200 OK (Dashboard reflects updated revenue)
```

---

### 3.2 Workflow 2: Restock and Cost Visibility (Inventory → E-Commerce, Sales, Finance)

```mermaid
sequenceDiagram
    autonumber
    actor Inventory as Inventory Staff (ERP)
    actor Customer as Customer (E-Commerce)
    actor Sales as Sales Staff (ERP)
    actor Finance as Finance Staff (ERP)
    participant API as Backend API (Express)
    participant DB as Neon PostgreSQL (Prisma)

    %% Step 1: Low-stock detection
    Note over Inventory,DB: Step 1: Low Stock Alert
    Inventory->>API: GET /api/inventory/low-stock
    API->>DB: Query products where stock <= reorderLevel AND isActive=true
    DB-->>API: Low stock product list
    API-->>Inventory: 200 OK (Surfaces items needing restock)

    %% Step 2: Stock-In Execution
    Note over Inventory,DB: Step 2: Stock-In Execution
    Inventory->>API: POST /api/inventory/stock-in (productId, quantity, unitCost, supplier)
    API->>DB: Transaction: Increment Product.stock by qty, create StockMovement(STOCK_IN, +qty, unitCost, reason)
    DB-->>API: Transaction Committed
    API-->>Inventory: 200 OK (Restocked successfully)

    %% Step 3: Catalog & Sales Visibility
    Note over Customer,Sales: Step 3: Cross-Department Stock Availability Reflection
    Customer->>API: GET /api/products/:id
    API->>DB: Query product details
    DB-->>API: Updated stock > reorderLevel
    API-->>Customer: 200 OK (Product badge reflects "In Stock", Add to Cart enabled)

    Sales->>API: POST /api/orders (Walk-in order creation)
    API->>DB: Validate available stock against updated inventory
    DB-->>API: Sufficient stock confirmed
    API-->>Sales: 201 Created (Walk-in order placed without rejection)

    %% Step 4: Finance Purchase Cost Update
    Note over Finance,DB: Step 4: Finance Purchase Expenditure Update
    Finance->>API: GET /api/finance/dashboard
    API->>DB: Aggregate SUM(quantity * unitCost) from StockMovement where type=STOCK_IN
    DB-->>API: Total Procurement Expenditure
    API-->>Finance: 200 OK (Dashboard displays updated "Inventory Purchase Cost")
```
