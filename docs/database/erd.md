# Database Entity-Relationship Diagram (ERD) & Schema Specifications

## 1. Overview

The VÉLORA database is a single centralized PostgreSQL database hosted on Neon. All five functional departments (Customer E-Commerce, ERP Sales, ERP Inventory & Warehouse, ERP Finance, and Administration) share this schema.

---

## 2. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o| Customer : "links to (online customer)"
    User ||--o{ Order : "creates (internal order)"
    User ||--o{ Order : "fulfills (staff fulfillment)"
    User ||--o{ Payment : "records (finance collection)"
    User ||--o{ StockMovement : "performs"
    User ||--o{ PasswordResetToken : "owns"
    User ||--o{ AuditLog : "acts in"

    Category ||--o{ Product : "classifies"

    Customer ||--o{ Order : "places"

    Order ||--|{ OrderItem : "contains"
    Order ||--o| Payment : "settled by"
    Order ||--o{ StockMovement : "references (sale movements)"

    Product ||--o{ OrderItem : "ordered in"
    Product ||--o{ StockMovement : "tracks movements for"

    User {
        int id PK
        string name
        string email UK
        string passwordHash
        string role "CUSTOMER, ADMIN, SALES, INVENTORY, FINANCE"
        boolean isActive "default true"
        datetime createdAt "default now"
        datetime updatedAt
    }

    Customer {
        int id PK
        int userId UK "nullable, unique"
        string name
        string phone
        string email "nullable"
        string address "nullable"
        datetime createdAt "default now"
        datetime updatedAt
    }

    Category {
        int id PK
        string name UK
        string description "nullable"
        datetime createdAt "default now"
    }

    Product {
        int id PK
        int categoryId FK
        string sku UK
        string name
        string brand
        string description
        string imageUrl
        string size "e.g. 50ml, 100ml"
        decimal unitPrice "Decimal(10,2)"
        int stock "CHECK (stock >= 0)"
        int reorderLevel "default 5"
        boolean isActive "default true"
        datetime createdAt "default now"
        datetime updatedAt
    }

    Order {
        int id PK
        string orderNumber UK "e.g. VEL-2026-0001"
        int customerId FK
        string source "ONLINE, INTERNAL"
        int createdById FK "nullable, User FK"
        string status "PENDING, FULFILLED, CANCELLED"
        string paymentStatus "UNPAID, PAID"
        string paymentMethod "COD"
        string deliveryAddress "snapshot"
        decimal total "Decimal(10,2)"
        datetime createdAt "default now"
        datetime fulfilledAt "nullable"
        int fulfilledById FK "nullable, User FK"
    }

    OrderItem {
        int id PK
        int orderId FK
        int productId FK
        string productName "snapshot"
        decimal unitPrice "Decimal(10,2) snapshot"
        int quantity
        decimal lineTotal "Decimal(10,2) snapshot"
    }

    Payment {
        int id PK
        int orderId UK FK "1:1 with Order"
        decimal amount "Decimal(10,2)"
        string method "CASH, BANK_TRANSFER, OTHER"
        string referenceNo "nullable"
        int recordedById FK "User FK"
        datetime paidAt "default now"
    }

    StockMovement {
        int id PK
        int productId FK
        string type "STOCK_IN, SALE, ADJUSTMENT"
        int quantity "signed (+/-)"
        decimal unitCost "Decimal(10,2) nullable"
        string reason "nullable"
        int referenceOrderId FK "nullable, Order FK"
        int performedById FK "User FK"
        datetime createdAt "default now"
    }

    PasswordResetToken {
        int id PK
        int userId FK
        string tokenHash UK "SHA-256 hash"
        datetime expiresAt "now + 30 mins"
        datetime usedAt "nullable"
        datetime createdAt "default now"
    }

    AuditLog {
        int id PK
        int actorId FK "nullable, User FK"
        string action
        string entityType
        string entityId
        string details "nullable JSON/text"
        datetime createdAt "default now"
    }
```

---

## 3. Detailed Table Specifications & Constraints

### 3.1 `User`

| Column         | Type           | Nullable | Attributes             | Description                                                 |
| -------------- | -------------- | -------- | ---------------------- | ----------------------------------------------------------- |
| `id`           | `INT`          | No       | `PK`, `AUTO_INCREMENT` | Internal user ID                                            |
| `name`         | `VARCHAR(100)` | No       |                        | Full user name                                              |
| `email`        | `VARCHAR(255)` | No       | `UNIQUE`, `INDEX`      | Unique email for authentication                             |
| `passwordHash` | `VARCHAR(255)` | No       |                        | Argon2id hash                                               |
| `role`         | `VARCHAR(20)`  | No       | `INDEX`                | Role (`CUSTOMER`, `ADMIN`, `SALES`, `INVENTORY`, `FINANCE`) |
| `isActive`     | `BOOLEAN`      | No       | `DEFAULT true`         | Account active status (deactivated cannot log in)           |
| `createdAt`    | `TIMESTAMP(3)` | No       | `DEFAULT NOW()`        | Registration timestamp                                      |
| `updatedAt`    | `TIMESTAMP(3)` | No       | `AUTO_UPDATE`          | Last modification timestamp                                 |

### 3.2 `Customer`

| Column      | Type           | Nullable | Attributes                 | Description                                      |
| ----------- | -------------- | -------- | -------------------------- | ------------------------------------------------ |
| `id`        | `INT`          | No       | `PK`, `AUTO_INCREMENT`     | Customer ID                                      |
| `userId`    | `INT`          | Yes      | `UNIQUE`, `FK -> User(id)` | Linked user account (null for walk-in customers) |
| `name`      | `VARCHAR(100)` | No       | `INDEX`                    | Customer full name                               |
| `phone`     | `VARCHAR(30)`  | No       | `INDEX`                    | Customer contact telephone/mobile                |
| `email`     | `VARCHAR(255)` | Yes      | `INDEX`                    | Contact email                                    |
| `address`   | `TEXT`         | Yes      |                            | Default delivery address                         |
| `createdAt` | `TIMESTAMP(3)` | No       | `DEFAULT NOW()`            | Record creation timestamp                        |
| `updatedAt` | `TIMESTAMP(3)` | No       | `AUTO_UPDATE`              | Last update timestamp                            |

### 3.3 `Category`

| Column        | Type           | Nullable | Attributes             | Description                                           |
| ------------- | -------------- | -------- | ---------------------- | ----------------------------------------------------- |
| `id`          | `INT`          | No       | `PK`, `AUTO_INCREMENT` | Category ID                                           |
| `name`        | `VARCHAR(100)` | No       | `UNIQUE`               | Category name (e.g., Floral, Woody, Oriental, Citrus) |
| `description` | `TEXT`         | Yes      |                        | Category description                                  |
| `createdAt`   | `TIMESTAMP(3)` | No       | `DEFAULT NOW()`        | Creation timestamp                                    |

### 3.4 `Product`

| Column         | Type            | Nullable | Attributes                    | Description                                         |
| -------------- | --------------- | -------- | ----------------------------- | --------------------------------------------------- |
| `id`           | `INT`           | No       | `PK`, `AUTO_INCREMENT`        | Product ID                                          |
| `categoryId`   | `INT`           | No       | `FK -> Category(id)`, `INDEX` | Category foreign key                                |
| `sku`          | `VARCHAR(50)`   | No       | `UNIQUE`, `INDEX`             | Stock Keeping Unit identifier (e.g. `VEL-PARF-001`) |
| `name`         | `VARCHAR(150)`  | No       | `INDEX`                       | Fragrance name                                      |
| `brand`        | `VARCHAR(100)`  | No       |                               | Brand name (VÉLORA or partnered atelier)            |
| `description`  | `TEXT`          | No       |                               | Olfactory notes and description                     |
| `imageUrl`     | `VARCHAR(500)`  | No       |                               | Web image URL                                       |
| `size`         | `VARCHAR(30)`   | No       |                               | Bottle volume (e.g., "50ml", "100ml")               |
| `unitPrice`    | `DECIMAL(10,2)` | No       |                               | Current retail selling price                        |
| `stock`        | `INT`           | No       | `CHECK (stock >= 0)`          | Available physical stock quantity                   |
| `reorderLevel` | `INT`           | No       | `DEFAULT 5`                   | Low-stock alert threshold                           |
| `isActive`     | `BOOLEAN`       | No       | `DEFAULT true`, `INDEX`       | Visibility toggle                                   |
| `createdAt`    | `TIMESTAMP(3)`  | No       | `DEFAULT NOW()`               | Creation timestamp                                  |
| `updatedAt`    | `TIMESTAMP(3)`  | No       | `AUTO_UPDATE`                 | Last update timestamp                               |

### 3.5 `Order`

| Column            | Type            | Nullable | Attributes                    | Description                                      |
| ----------------- | --------------- | -------- | ----------------------------- | ------------------------------------------------ |
| `id`              | `INT`           | No       | `PK`, `AUTO_INCREMENT`        | Internal Order ID                                |
| `orderNumber`     | `VARCHAR(50)`   | No       | `UNIQUE`, `INDEX`             | Human-readable order number (`VEL-YYYY-XXXX`)    |
| `customerId`      | `INT`           | No       | `FK -> Customer(id)`, `INDEX` | Recipient customer                               |
| `source`          | `VARCHAR(20)`   | No       | `INDEX`                       | Order origin: `ONLINE` or `INTERNAL`             |
| `createdById`     | `INT`           | Yes      | `FK -> User(id)`              | Staff member who created order (null for online) |
| `status`          | `VARCHAR(20)`   | No       | `INDEX`                       | `PENDING`, `FULFILLED`, `CANCELLED`              |
| `paymentStatus`   | `VARCHAR(20)`   | No       | `INDEX`                       | `UNPAID`, `PAID`                                 |
| `paymentMethod`   | `VARCHAR(20)`   | No       | `DEFAULT 'COD'`               | Payment method fixed to `COD`                    |
| `deliveryAddress` | `TEXT`          | No       |                               | Delivery address snapshotted at checkout         |
| `total`           | `DECIMAL(10,2)` | No       |                               | Recomputed order total sum                       |
| `createdAt`       | `TIMESTAMP(3)`  | No       | `DEFAULT NOW()`, `INDEX`      | Order placement timestamp                        |
| `fulfilledAt`     | `TIMESTAMP(3)`  | Yes      |                               | Fulfillment timestamp                            |
| `fulfilledById`   | `INT`           | Yes      | `FK -> User(id)`              | Inventory staff who fulfilled order              |

### 3.6 `OrderItem`

| Column        | Type            | Nullable | Attributes                                   | Description                                  |
| ------------- | --------------- | -------- | -------------------------------------------- | -------------------------------------------- |
| `id`          | `INT`           | No       | `PK`, `AUTO_INCREMENT`                       | Line item ID                                 |
| `orderId`     | `INT`           | No       | `FK -> Order(id) ON DELETE CASCADE`, `INDEX` | Parent order reference                       |
| `productId`   | `INT`           | No       | `FK -> Product(id)`, `INDEX`                 | Ordered product reference                    |
| `productName` | `VARCHAR(150)`  | No       |                                              | Product name snapshotted at time of purchase |
| `unitPrice`   | `DECIMAL(10,2)` | No       |                                              | Unit price snapshotted from Product table    |
| `quantity`    | `INT`           | No       | `CHECK (quantity > 0)`                       | Ordered units                                |
| `lineTotal`   | `DECIMAL(10,2)` | No       |                                              | `quantity * unitPrice` snapshotted           |

### 3.7 `Payment`

| Column         | Type            | Nullable | Attributes                  | Description                               |
| -------------- | --------------- | -------- | --------------------------- | ----------------------------------------- |
| `id`           | `INT`           | No       | `PK`, `AUTO_INCREMENT`      | Payment record ID                         |
| `orderId`      | `INT`           | No       | `UNIQUE`, `FK -> Order(id)` | 1-to-1 link with fulfilled order          |
| `amount`       | `DECIMAL(10,2)` | No       |                             | Amount collected (must match order total) |
| `method`       | `VARCHAR(30)`   | No       | `DEFAULT 'CASH'`            | `CASH`, `BANK_TRANSFER`, `OTHER`          |
| `referenceNo`  | `VARCHAR(100)`  | Yes      |                             | Receipt or reference number               |
| `recordedById` | `INT`           | No       | `FK -> User(id)`            | Finance staff member recording collection |
| `paidAt`       | `TIMESTAMP(3)`  | No       | `DEFAULT NOW()`, `INDEX`    | Payment settlement timestamp              |

### 3.8 `StockMovement`

| Column             | Type            | Nullable | Attributes                   | Description                             |
| ------------------ | --------------- | -------- | ---------------------------- | --------------------------------------- |
| `id`               | `INT`           | No       | `PK`, `AUTO_INCREMENT`       | Movement log ID                         |
| `productId`        | `INT`           | No       | `FK -> Product(id)`, `INDEX` | Targeted product                        |
| `type`             | `VARCHAR(20)`   | No       | `INDEX`                      | `STOCK_IN`, `SALE`, `ADJUSTMENT`        |
| `quantity`         | `INT`           | No       |                              | Signed quantity delta (+/-)             |
| `unitCost`         | `DECIMAL(10,2)` | Yes      |                              | Procurement unit cost (for `STOCK_IN`)  |
| `reason`           | `TEXT`          | Yes      |                              | Reason note (mandatory on `ADJUSTMENT`) |
| `referenceOrderId` | `INT`           | Yes      | `FK -> Order(id)`, `INDEX`   | Associated order for `SALE` movements   |
| `performedById`    | `INT`           | No       | `FK -> User(id)`             | Staff member executing movement         |
| `createdAt`        | `TIMESTAMP(3)`  | No       | `DEFAULT NOW()`, `INDEX`     | Immutable timestamp                     |

### 3.9 `PasswordResetToken`

| Column      | Type           | Nullable | Attributes                | Description                                    |
| ----------- | -------------- | -------- | ------------------------- | ---------------------------------------------- |
| `id`        | `INT`          | No       | `PK`, `AUTO_INCREMENT`    | Token record ID                                |
| `userId`    | `INT`          | No       | `FK -> User(id)`, `INDEX` | Account owner                                  |
| `tokenHash` | `VARCHAR(64)`  | No       | `UNIQUE`, `INDEX`         | SHA-256 hash of the random reset token         |
| `expiresAt` | `TIMESTAMP(3)` | No       | `INDEX`                   | Expiration (strictly 30 minutes from creation) |
| `usedAt`    | `TIMESTAMP(3)` | Yes      |                           | Invalidation timestamp once consumed           |
| `createdAt` | `TIMESTAMP(3)` | No       | `DEFAULT NOW()`           | Generation timestamp                           |

### 3.10 `AuditLog`

| Column       | Type           | Nullable | Attributes             | Description                                 |
| ------------ | -------------- | -------- | ---------------------- | ------------------------------------------- |
| `id`         | `INT`          | No       | `PK`, `AUTO_INCREMENT` | Audit record ID                             |
| `actorId`    | `INT`          | Yes      | `FK -> User(id)`       | User performing the action                  |
| `action`     | `VARCHAR(100)` | No       | `INDEX`                | Action descriptor (e.g. `USER_DEACTIVATED`) |
| `entityType` | `VARCHAR(50)`  | No       | `INDEX`                | Target entity (`User`, `Product`, `Order`)  |
| `entityId`   | `VARCHAR(50)`  | No       |                        | Target entity primary key                   |
| `details`    | `TEXT`         | Yes      |                        | Supplemental metadata or JSON payload       |
| `createdAt`  | `TIMESTAMP(3)` | No       | `DEFAULT NOW()`        | Log timestamp                               |

---

## 4. Key Relational Invariants & Rules

1. **Stock Non-Negativity:** Enforced at DB level by `CHECK (stock >= 0)` on table `Product`, as well as guarded inside transactional queries before deducting stock.
2. **Immutability of StockMovements:** Once created, rows in `StockMovement` must never be updated or deleted.
3. **Transactional Integrity:**
   - Order creation checks stock and locks line item prices inside a `prisma.$transaction`.
   - Order fulfillment verifies all line item stock, deducts stock, records `SALE` movements, and updates status inside `prisma.$transaction`.
   - Stock-in increments stock and records `STOCK_IN` movement inside `prisma.$transaction`.
4. **Monetary Precision:** All currency fields (`unitPrice`, `lineTotal`, `total`, `amount`, `unitCost`) use `DECIMAL(10,2)`. No JavaScript floating point math.
