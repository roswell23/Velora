# Spec: ERP Inventory & Warehouse

Owner: Member 4 Status: Approved Version: 1.1

## 1. Purpose

Manage product items and olfactory categories, handle supplier restocking (stock-in), perform auditable stock adjustments, inspect low-stock alerts, track immutable stock movement logs, and fulfill orders with atomic transactional stock deductions.

## 2. Roles and Permissions

- **`INVENTORY`, `ADMIN`:** Full management of categories, products, stock-in, and stock adjustments. Inventory staff can view pending orders; only `ADMIN` can fulfill or cancel orders.
- **`FINANCE`:** Read-only access to stock movement history and unit costs.
- **`SALES`:** Read-only access to product catalog and stock availability.
- **`CUSTOMER`:** Public read-only access to active products.

## 3. Requirements

| ID     | Requirement                                                                                                                                                                                            | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| INV-01 | Inventory dashboard displays total active products, low-stock alerts count, and unfulfilled pending orders count.                                                                                      | Must     |
| INV-02 | Category CRUD: create, list, and edit fragrance categories with unique name validation.                                                                                                                | Must     |
| INV-03 | Product CRUD: create, list, edit, and toggle active state for perfume items with unique SKU validation.                                                                                                | Must     |
| INV-04 | Stock-in transaction: accepts product ID, quantity, unit cost, and supplier name; increments `Product.stock` and creates `StockMovement(type = 'STOCK_IN')`.                                           | Must     |
| INV-05 | Stock adjustment transaction: accepts product ID, signed quantity delta, and mandatory reason; updates stock and creates `StockMovement(type = 'ADJUSTMENT')`.                                         | Must     |
| INV-06 | Low-stock list displays all products where `stock <= reorderLevel`.                                                                                                                                    | Must     |
| INV-07 | Stock movement audit view lists immutable log per product with movement type, signed quantity, unit cost, reason, actor, and timestamp.                                                                | Must     |
| INV-08 | Order fulfillment runs in a single database transaction: verifies stock >= quantity for all line items, deducts stock, writes `StockMovement(type = 'SALE')`, and updates order status to `FULFILLED`. | Must     |
| INV-09 | If any line item lacks sufficient stock during fulfillment, transaction aborts completely and stock is not deducted.                                                                                   | Must     |
| INV-10 | Stock quantity can never fall below zero (enforced by DB check constraint `CHECK (stock >= 0)` and application guard).                                                                                 | Must     |

## 4. Data Used

| Table           | Fields Read                              | Fields Written                                                                                                            | Notes                                   |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `Category`      | `id`, `name`, `description`              | `name`, `description`                                                                                                     | Unique category names                   |
| `Product`       | All fields                               | `categoryId`, `sku`, `name`, `brand`, `description`, `imageUrl`, `size`, `unitPrice`, `stock`, `reorderLevel`, `isActive` | `stock >= 0` check constraint           |
| `StockMovement` | All fields                               | All fields (`id`, `productId`, `type`, `quantity`, `unitCost`, `reason`, `referenceOrderId`, `performedById`)             | Immutable: never updated or deleted     |
| `Order`         | `id`, `status`, `orderNumber`            | `status`, `fulfilledAt`, `fulfilledById`                                                                                  | Status updated to `FULFILLED`           |
| `OrderItem`     | `id`, `orderId`, `productId`, `quantity` | None                                                                                                                      | Read during fulfillment stock deduction |

## 5. API Endpoints

- `POST /api/categories` — `INVENTORY`, `ADMIN`; create category.
- `PUT /api/categories/:id` — `INVENTORY`, `ADMIN`; update category.
- `POST /api/products` — `INVENTORY`, `ADMIN`; create product with SKU and pricing.
- `PUT /api/products/:id` — `INVENTORY`, `ADMIN`; update product details.
- `POST /api/inventory/stock-in` — `INVENTORY`, `ADMIN`; restock product.
- `POST /api/inventory/adjust` — `INVENTORY`, `ADMIN`; manual stock adjustment.
- `GET /api/inventory/low-stock` — `INVENTORY`, `ADMIN`; retrieve products at or below reorder level.
- `GET /api/inventory/movements` — `INVENTORY`, `ADMIN`, `FINANCE`; audit trail of stock movements.
- `POST /api/orders/:id/fulfill` — `ADMIN`; execute atomic order fulfillment.
- `POST /api/orders/:id/cancel` — `ADMIN`; cancel a pending order.

## 6. UI Pages and Behavior

- **Inventory Dashboard (`/admin/inventory`):**
  - KPI Stat Cards: Total Products, Low Stock Count, Orders Awaiting Fulfillment.
  - Quick action shortcuts: Restock and New Product.
- **Product & Category Management (`/admin/inventory/products`):**
  - Data table of products: SKU, Name, Category, Size, Price, Current Stock, Status (`Active` / `Inactive`).
  - Search by name/SKU, category filter dropdown.
  - "New Product" modal with image preview, price, and initial stock.
  - "Edit Product" modal with active/inactive toggle.
- **Low-Stock & Reorder Page (`/admin/inventory/low-stock`):**
  - Table of products where `stock <= reorderLevel`.
  - Amber warning badges with quick "Stock In" action button.
- **Restock Modal:**
  - Product selector, Quantity to add, Unit Procurement Cost, Supplier text, Notes.
- **Stock Movement Log (`/admin/inventory/movements`):**
  - Read-only table showing Date, Product SKU, Type (`STOCK_IN`, `SALE`, `ADJUSTMENT`), Quantity (+/-), Unit Cost, Reason, Staff Actor.
- **Sales Orders (`/sales`):**
  - Admin sees pending orders with admin-only "Fulfill" and "Cancel" actions.
  - Sales staff can view order status but cannot change it.
- **Inventory Pending Orders:**
  - Inventory staff may inspect `PENDING` orders and item requirements, but cannot change order status.

## 7. Business Rules and Validations

- Only `ADMIN` may fulfill or cancel an order. `SALES` and `INVENTORY` roles can view statuses but cannot change them.
- Order fulfillment MUST be atomic using `prisma.$transaction`:
  1. Lock and check `Product.stock >= lineItem.quantity` for all items.
  2. If any item is short, throw error with exact missing item and abort transaction.
  3. Deduct stock: `stock = stock - lineItem.quantity`.
  4. Create `StockMovement` row with `type = 'SALE'`, negative quantity, and `referenceOrderId = order.id`.
  5. Update `Order.status = 'FULFILLED'`, `fulfilledAt = NOW()`, `fulfilledById = req.user.id`.
- Stock adjustments cannot cause stock to drop below 0.
- Stock movements are strictly append-only (no update, no delete endpoints).

## 8. Acceptance Criteria

- **Scenario:** Admin Order Fulfillment (Workflow 1 Step 3)
  - Given a pending order for 1 bottle of Santal Royale and current stock = 10, When Admin triggers fulfill from Sales orders, Then stock decreases to 9, a `SALE` movement (-1) is recorded, and order status transitions to `FULFILLED` [INV-08].
- **Scenario:** Fulfillment Rollback on Stock Shortage
  - Given a pending order for 5 bottles and current stock = 2, When Admin triggers fulfill, Then fulfillment is rejected with 400 Bad Request and stock remains unchanged at 2 [INV-08, INV-09].
- **Scenario:** Restock Execution (Workflow 2 Step 2)
  - Given a perfume with stock = 2, When Inventory records stock-in of 15 units at unit cost $80, Then stock increases to 17, a `STOCK_IN` movement (+15, unitCost $80) is logged, and product drops out of low-stock view [INV-04, INV-06].
- **Scenario:** Non-Negativity Enforcement
  - Given a product with stock = 3, When attempting an adjustment of -5, Then operation is rejected and DB check constraint prevents negative stock [INV-05, INV-10].

## 9. Test Cases

- `TC-INV-01`: Create product with unique SKU -> 201 Created.
- `TC-INV-02`: Create product with duplicate SKU -> 409 Conflict.
- `TC-INV-03`: Execute stock-in -> 200 OK, stock increased, STOCK_IN movement recorded.
- `TC-INV-04`: Adjust stock with valid reason -> 200 OK, ADJUSTMENT movement recorded.
- `TC-INV-05`: Adjust stock resulting in negative quantity -> 400 Bad Request.
- `TC-INV-06`: Fulfill order with adequate stock -> 200 OK, status FULFILLED, SALE movement recorded.
- `TC-INV-07`: Fulfill order with insufficient stock -> 400 Bad Request, transaction rolled back.

## 10. Dependencies on Other Modules

- Supplies product and stock data to E-Commerce A (Member 1) and ERP Sales (Member 3).
- Fulfills orders placed by E-Commerce B (Member 2) and Sales (Member 3).
- Stock-in unit costs feed into ERP Finance for purchasing expenditure tracking (Member 5).
