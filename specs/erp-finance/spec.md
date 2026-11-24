# Spec: ERP Finance

Owner: Member 5 Status: Approved Version: 1.0

## 1. Purpose

Manage financial reconciliation for Cash on Delivery (COD) orders, record payment collections for fulfilled orders, monitor accounts receivable, track inventory procurement expenditure, and generate aggregate revenue reports.

## 2. Roles and Permissions

- **`FINANCE`, `ADMIN`:** Full access to record payments, inspect payment receipts, view the finance dashboard, and generate revenue summaries.
- **`SALES`, `INVENTORY`:** Read-only visibility into payment status on order records; no access to financial recording endpoints or finance dashboard.
- **`CUSTOMER`:** No access to ERP Finance endpoints.

## 3. Requirements

| ID     | Requirement                                                                                                                                                                           | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FIN-01 | Finance dashboard displays core KPIs: Total Revenue (paid orders only), Unpaid Receivables (fulfilled unpaid orders), and Inventory Purchase Cost (total procurement from stock-ins). | Must     |
| FIN-02 | Payment recording is permitted if and only if order status is `FULFILLED` and payment status is `UNPAID`.                                                                             | Must     |
| FIN-03 | Payment recording captures amount (must equal order total), payment method (`CASH`, `BANK_TRANSFER`, `OTHER`), optional reference number, and `recordedById`.                         | Must     |
| FIN-04 | When payment is recorded, order `paymentStatus` atomically transitions to `PAID` within a database transaction.                                                                       | Must     |
| FIN-05 | Only one payment record can be associated with an order (`orderId` unique constraint).                                                                                                | Must     |
| FIN-06 | Strict Revenue Recognition Rule: Only orders with a confirmed `Payment` record count as revenue. Pending, unfulfilled, or unpaid orders are strictly excluded from revenue metrics.   | Must     |
| FIN-07 | Revenue summary aggregates collected payments grouped by day or by month across customizable date ranges.                                                                             | Must     |
| FIN-08 | Inventory purchase cost is aggregated dynamically by summing `quantity * unitCost` from all `StockMovement` records where `type = 'STOCK_IN'`.                                        | Must     |
| FIN-09 | Payments history view provides search by order number or reference number with pagination.                                                                                            | Must     |

## 4. Data Used

| Table           | Fields Read                                                                               | Fields Written  | Notes                                                                |
| --------------- | ----------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------- |
| `Payment`       | All fields (`id`, `orderId`, `amount`, `method`, `referenceNo`, `recordedById`, `paidAt`) | All fields      | Unique constraint on `orderId`                                       |
| `Order`         | `id`, `orderNumber`, `customerId`, `status`, `paymentStatus`, `total`, `fulfilledAt`      | `paymentStatus` | Updated from `UNPAID` to `PAID`                                      |
| `StockMovement` | `id`, `type`, `quantity`, `unitCost`, `createdAt`                                         | None            | Read-only aggregation of procurement costs where `type = 'STOCK_IN'` |
| `Customer`      | `id`, `name`, `phone`                                                                     | None            | Customer details displayed alongside payment receipts                |

## 5. API Endpoints

- `GET /api/finance/dashboard` — `FINANCE`, `ADMIN`; retrieves aggregated KPIs (Revenue, Receivables, Inventory Costs).
- `GET /api/finance/revenue` — `FINANCE`, `ADMIN`; retrieves revenue grouped by day or month with parameters `startDate`, `endDate`, `groupBy`.
- `POST /api/payments` — `FINANCE`, `ADMIN`; records COD payment collection for a fulfilled order.
- `GET /api/payments` — `FINANCE`, `ADMIN`; lists and searches payment records with pagination.
- `GET /api/payments/:id` — `FINANCE`, `ADMIN`; retrieves single payment receipt details.

## 6. UI Pages and Behavior

- **Finance Dashboard (`/admin/finance`):**
  - KPI Stat Cards:
    - **Total Revenue:** Sum of all paid orders.
    - **Unpaid Receivables:** Sum of fulfilled orders awaiting payment collection.
    - **Inventory Purchase Cost:** Total spent on restocks.
  - Revenue Trend summary table (grouped by day/month).
- **Orders Awaiting Payment (`/admin/finance/unpaid`):**
  - Data table filtering orders where `status = 'FULFILLED'` and `paymentStatus = 'UNPAID'`.
  - Order details: Order Number, Customer, Date Fulfilled, Total Amount.
  - "Record Payment" action button opening collection modal.
- **Record Payment Modal:**
  - Displays Order Number and Customer Name.
  - Pre-filled Amount (locked to exact order total).
  - Payment Method dropdown (`CASH` default, `BANK_TRANSFER`, `OTHER`).
  - Reference / Receipt Number text input.
  - "Confirm Payment" button.
- **Payments Ledger (`/admin/finance/payments`):**
  - Data table of all recorded payments: Payment ID, Order Number, Amount, Method, Reference No, Collected By, Settlement Date.
  - Search by order number or reference number.

## 7. Business Rules and Validations

- **Revenue Rule:** Revenue is calculated strictly from settled payments (`paymentStatus = 'PAID'`). Never include unfulfilled or unpaid orders in revenue calculations.
- **Pre-Conditions for Payment Recording:**
  - Order must exist.
  - `Order.status` must be `FULFILLED`. Attempting to record payment on `PENDING` or `CANCELLED` order throws `400 Bad Request` (`ORDER_NOT_FULFILLED`).
  - `Order.paymentStatus` must be `UNPAID`. If already `PAID`, throws `400 Bad Request` (`ORDER_ALREADY_PAID`).
  - `Payment.amount` must strictly equal `Order.total`. Partial payments are outside project scope.
- **Atomic State Update:** Payment creation and `Order.paymentStatus = 'PAID'` run inside `prisma.$transaction`.

## 8. Acceptance Criteria

- **Scenario:** Payment Recording (Workflow 1 Step 5)
  - Given a fulfilled order with `paymentStatus = UNPAID` for $185.00, When Finance records cash payment of $185.00, Then a `Payment` record is created, order `paymentStatus` becomes `PAID`, and returns 201 Created [FIN-02, FIN-03, FIN-04].
- **Scenario:** Prevent Payment on Pending Order
  - Given an order in `PENDING` status, When Finance attempts to record payment, Then server rejects with 400 Bad Request [FIN-02].
- **Scenario:** Prevent Duplicate Payment
  - Given an order already marked `PAID`, When attempting another payment record, Then server rejects with 400 Bad Request [FIN-02, FIN-05].
- **Scenario:** Revenue Metrics Reflection
  - Given a newly recorded payment of $185.00, When querying `GET /api/finance/dashboard`, Then `totalRevenue` increases by $185.00 and `unpaidTotal` decreases accordingly [FIN-01, FIN-06].
- **Scenario:** Restock Cost Visibility (Workflow 2 Step 3)
  - Given a stock-in of 20 units at $95.00 ($1,900.00 total), When querying Finance dashboard, Then `inventoryPurchaseCost` includes the $1,900.00 expenditure [FIN-01, FIN-08].

## 9. Test Cases

- `TC-FIN-01`: Record payment for fulfilled order -> 201 Created, order status updated to PAID.
- `TC-FIN-02`: Record payment for pending order -> 400 Bad Request (`ORDER_NOT_FULFILLED`).
- `TC-FIN-03`: Record payment for already paid order -> 400 Bad Request (`ORDER_ALREADY_PAID`).
- `TC-FIN-04`: Record payment with mismatched amount -> 400 Bad Request (`AMOUNT_MISMATCH`).
- `TC-FIN-05`: Non-finance staff attempts to record payment -> 403 Forbidden.
- `TC-FIN-06`: Query finance dashboard -> Returns calculated totalRevenue, unpaidTotal, and inventoryPurchaseCost.

## 10. Dependencies on Other Modules

- Consumes fulfilled orders from ERP Inventory (Member 4) for payment reconciliation.
- Reads `StockMovement` unit costs logged by ERP Inventory (Member 4) for procurement cost calculations.
