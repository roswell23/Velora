# Demonstration Script: VÉLORA Workflows

**Course:** System Integration and Architecture Group Project  
**Team Members & Roles:**

- **Member 1:** E-Commerce A (Catalog, Product Details, Cart)
- **Member 2:** E-Commerce B (Customer Auth, Checkout, Order Tracker)
- **Member 3:** ERP Sales (Customer Records, Walk-in Orders, Order Monitoring)
- **Member 4:** ERP Inventory & Warehouse (Catalog, Restock, Order Fulfillment)
- **Member 5:** ERP Finance (Payment Reconciliation, Revenue Analytics, Admin)

---

## 1. Demo Setup & Initial State

- **Backend API:** Running on `http://localhost:5000`
- **Customer Storefront:** Running on `http://localhost:5173`
- **ERP Staff Portal:** Running on `http://localhost:5174`
- **Database:** Seed data initialized with products (e.g. Santal Royale with 10 units, Fleur de Soie with 2 units low-stock).

---

## 2. WORKFLOW 1: Online Order to Payment (Cross-Department Integration)

```text
E-Commerce (Member 2) ──► ERP Sales (Member 3) ──► ERP Inventory (Member 4) ──► E-Commerce (Member 2) ──► ERP Finance (Member 5)
```

### Step 1: Customer Online Order Placement

- **Presenter:** Member 2 (E-Commerce B) & Member 1 (E-Commerce A)
- **Application:** E-Commerce Boutique (`http://localhost:5173`)
- **Action:**
  1. Member 1 navigates to the catalog, demonstrates filtering by "Woody", and opens "Santal Royale" (100ml, $185.00). Notes that stock shows "In Stock".
  2. Member 1 adds 1 bottle to the shopping cart and opens the Cart slide-over showing subtotal $185.00.
  3. Member 2 logs in as demo customer `customer@velora.local` and proceeds to Checkout.
  4. Confirms delivery address snapshot, notes payment method is Cash on Delivery (COD), and clicks **"Place Order"**.
- **System Verification:**
  - Order confirmed: `VEL-2026-0010`.
  - Backend creates order with `status = PENDING`, `paymentStatus = UNPAID`, `source = ONLINE`.
  - Customer views order in Order History: tracker indicates `Pending`.
- **Oral Defense Point (Member 2):**
  _"The backend verified available stock inside a transaction and snapshotted the current unit price from the database rather than trusting the cart total sent by the browser."_

---

### Step 2: Sales Department Order Visibility

- **Presenter:** Member 3 (ERP Sales)
- **Application:** ERP Portal (`http://localhost:5174`)
- **Action:**
  1. Logs into ERP portal with Sales credentials (`sales@velora.local`).
  2. Navigates to **Sales > Orders**.
  3. Filters by source `ONLINE` and status `PENDING`.
  4. Identifies order `VEL-2026-0010` submitted by `Jane Doe` with total $185.00.
  5. Opens order details modal displaying line items and delivery address.
- **Oral Defense Point (Member 3):**
  _"Both online boutique orders and internal orders appear in our centralized order register in real time because all departments read from the same PostgreSQL database."_

---

### Step 3: Inventory Fulfillment & Stock Deduction

- **Presenter:** Member 4 (ERP Inventory)
- **Application:** ERP Portal (`http://localhost:5174`)
- **Action:**
  1. Logs in with Inventory credentials (`inventory@velora.local`).
  2. Navigates to **Inventory > Orders to Fulfill**.
  3. Locates order `VEL-2026-0010` and reviews required stock for Santal Royale.
  4. Clicks **"Fulfill Order"**.
- **System Verification:**
  - Order status transitions to `FULFILLED`.
  - Stock for Santal Royale decrements from 10 to 9.
  - An immutable `SALE` movement row (-1) is recorded in `StockMovement`.
- **Oral Defense Point (Member 4):**
  _"Fulfillment executes inside an atomic `prisma.$transaction`. If stock had been depleted between order placement and fulfillment, the transaction would roll back completely without deducting partial items."_

---

### Step 4: Customer Order Tracker Reflection

- **Presenter:** Member 2 (E-Commerce B)
- **Application:** E-Commerce Boutique (`http://localhost:5173`)
- **Action:**
  1. Refreshes the customer Order Details page for `VEL-2026-0010`.
  2. Order progression tracker automatically advances to **"Fulfilled"** with fulfillment timestamp.
- **Oral Defense Point (Member 2):**
  _"Customer order tracking reflects the exact state updated by the warehouse staff, demonstrating bidirectional customer-to-enterprise integration."_

---

### Step 5: Finance COD Collection & Revenue Update

- **Presenter:** Member 5 (ERP Finance)
- **Application:** ERP Portal (`http://localhost:5174`)
- **Action:**
  1. Logs into ERP portal with Finance credentials (`finance@velora.local`).
  2. Navigates to **Finance > Orders Awaiting Payment**.
  3. Locates fulfilled order `VEL-2026-0010` (Total: $185.00, Payment: UNPAID).
  4. Clicks **"Record Payment"**, selects `CASH` (COD received from courier), enters reference `REC-2026-1044`, and submits.
  5. Navigates to **Finance Dashboard**.
- **System Verification:**
  - Order `paymentStatus` transitions to `PAID`.
  - Finance dashboard Total Revenue increases by $185.00.
  - Unpaid receivables decrease by $185.00.
- **Oral Defense Point (Member 5):**
  _"In accordance with strict financial accounting principles, revenue is recognized only upon verified payment collection, excluding pending or unpaid orders from revenue figures."_

---

## 3. WORKFLOW 2: Restock and Cost Visibility (Inventory → E-Commerce, Sales, Finance)

```text
ERP Inventory (Member 4) ──► E-Commerce (Member 1) & ERP Sales (Member 3) ──► ERP Finance (Member 5)
```

### Step 1: Low-Stock Detection

- **Presenter:** Member 4 (ERP Inventory)
- **Application:** ERP Portal (`http://localhost:5174`)
- **Action:**
  1. Opens **Inventory > Low Stock** alert view.
  2. Shows perfume "Fleur de Soie" flagged with an amber badge: `Current Stock: 2` (Reorder Level: 5).

---

### Step 2: Restock Transaction Execution

- **Presenter:** Member 4 (ERP Inventory)
- **Application:** ERP Portal (`http://localhost:5174`)
- **Action:**
  1. Clicks **"Stock In"** for Fleur de Soie.
  2. Inputs: Quantity = `20`, Unit Procurement Cost = `$85.00`, Supplier = `Grasse Atelier Distillers`.
  3. Clicks **"Confirm Restock"**.
- **System Verification:**
  - Stock increases from 2 to 22.
  - Product drops off the low-stock alert list.
  - A `STOCK_IN` record (+20 units, $85.00 unit cost) is committed to `StockMovement`.
- **Oral Defense Point (Member 4):**
  _"Restocking is an atomic operation that both updates current physical balance and writes an immutable audit record with procurement cost."_

---

### Step 3: E-Commerce & Sales Stock Visibility

- **Presenter:** Member 1 (E-Commerce A) & Member 3 (ERP Sales)
- **Application:** E-Commerce Boutique & ERP Sales
- **Action:**
  1. Member 1 opens Fleur de Soie on the storefront: badge immediately updates from "Only 2 bottles remaining" to "In Stock", and full quantities can be added to the bag.
  2. Member 3 opens Walk-in Order builder in ERP Sales: product selector now shows 22 units available for in-store walk-in clients.
- **Oral Defense Point (Member 1 & 3):**
  _"The storefront and sales POS do not maintain isolated inventory caches; stock availability is read directly from the shared database."_

---

### Step 4: Finance Purchase Expenditure Update

- **Presenter:** Member 5 (ERP Finance)
- **Application:** ERP Portal (`http://localhost:5174`)
- **Action:**
  1. Refreshes **Finance Dashboard**.
  2. Points to **Inventory Purchase Cost** metric: expenditure has increased by $1,700.00 (`20 units * $85.00`).
- **Oral Defense Point (Member 5):**
  _"Finance monitors total inventory acquisition costs dynamically aggregated from historical `STOCK_IN` movement logs."_
