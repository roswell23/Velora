# Spec: ERP Sales

Owner: Member 3 Status: Approved Version: 1.0

## 1. Purpose

Empower the Sales department with real-time tracking of online boutique orders, walk-in customer profile management, manual creation of internal orders for in-store walk-in clients, order cancellation, and sales pipeline metrics.

## 2. Roles and Permissions

- **`SALES`, `ADMIN`:** Full management of customer profiles, order viewing, walk-in order creation (`source = INTERNAL`), and order cancellation (while `PENDING`).
- **`INVENTORY`, `FINANCE`:** Read-only access to customer list and order list.
- **`CUSTOMER`:** No access to ERP Sales endpoints.

## 3. Requirements

| ID     | Requirement                                                                                                                                           | Priority |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| SAL-01 | Sales dashboard displays key metrics: total orders, pending orders, online orders count, internal orders count, and total customers.                  | Must     |
| SAL-02 | Customer database surfaces both online-registered customers and in-store walk-in customers with live search by name, phone, or email.                 | Must     |
| SAL-03 | Sales staff can register and edit walk-in customer records (name, phone, optional email, address).                                                    | Must     |
| SAL-04 | Orders view lists all orders from all sources (`ONLINE` and `INTERNAL`) with status badges and source tags.                                           | Must     |
| SAL-05 | Orders view provides multi-criteria filtering by order status (`PENDING`, `FULFILLED`, `CANCELLED`), source (`ONLINE`, `INTERNAL`), and search query. | Must     |
| SAL-06 | Sales staff can create walk-in orders (`source = INTERNAL`) for existing or newly added customers.                                                    | Must     |
| SAL-07 | Walk-in order creation displays real-time stock levels and validates sufficient inventory before creation.                                            | Must     |
| SAL-08 | Walk-in order totals are recomputed on backend from database product unit prices.                                                                     | Must     |
| SAL-09 | Sales staff can cancel any order while status is strictly `PENDING`.                                                                                  | Must     |

## 4. Data Used

| Table       | Fields Read                                                                                                 | Fields Written                                                                                              | Notes                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `Customer`  | `id`, `userId`, `name`, `phone`, `email`, `address`, `createdAt`                                            | `name`, `phone`, `email`, `address`                                                                         | Walk-in customers have `userId = null`           |
| `Order`     | `id`, `orderNumber`, `customerId`, `source`, `createdById`, `status`, `paymentStatus`, `total`, `createdAt` | `orderNumber`, `customerId`, `source`, `createdById`, `status`, `paymentStatus`, `deliveryAddress`, `total` | `source = INTERNAL`, `createdById = req.user.id` |
| `OrderItem` | All fields                                                                                                  | `orderId`, `productId`, `productName`, `unitPrice`, `quantity`, `lineTotal`                                 | Snapshotted items                                |
| `Product`   | `id`, `name`, `sku`, `unitPrice`, `stock`, `isActive`                                                       | None                                                                                                        | Stock inspected before order placement           |

## 5. API Endpoints

- `GET /api/customers` — `SALES`, `ADMIN`, `INVENTORY`, `FINANCE`; search and list customers.
- `POST /api/customers` — `SALES`, `ADMIN`; create walk-in customer record.
- `GET /api/customers/:id` — `SALES`, `ADMIN`, `INVENTORY`, `FINANCE`; get customer details.
- `PUT /api/customers/:id` — `SALES`, `ADMIN`; update customer details.
- `GET /api/orders` — `SALES`, `ADMIN`, `INVENTORY`, `FINANCE`; search, filter, and paginate orders.
- `POST /api/orders` — `SALES`, `ADMIN`; create walk-in internal order.
- `GET /api/orders/:id` — `SALES`, `ADMIN`, `INVENTORY`, `FINANCE`; get complete order details.
- `POST /api/orders/:id/cancel` — `SALES`, `ADMIN`; cancel order while `PENDING`.

## 6. UI Pages and Behavior

- **Sales Dashboard (`/admin/sales`):**
  - KPI Stat Cards: Total Orders, Pending Orders, Online vs Walk-in breakdown, Total Customers.
  - Recent Orders table with source pill (`Online` / `Internal`) and status indicator.
- **Customers Directory (`/admin/sales/customers`):**
  - Searchable data table showing Customer Name, Phone, Email, Type (`Online` / `Walk-in`), Date Registered.
  - "Add Walk-in Customer" button opening creation modal.
  - "Edit Customer" action.
- **Orders Management (`/admin/sales/orders`):**
  - Tab filters: All, Online Orders, Walk-in Orders, Pending, Fulfilled, Cancelled.
  - Order details modal showing customer snapshot, ordered items, line prices, and status.
  - "Create Walk-in Order" CTA button opening order builder modal:
    - Customer search & selection dropdown.
    - Product picker showing live available stock.
    - Quantity selector with stock ceiling.
    - Live order summary.
  - "Cancel Order" action enabled only for `PENDING` orders with confirmation dialog.

## 7. Business Rules and Validations

- Walk-in orders created by staff set `source = 'INTERNAL'` and `createdById = req.user.id`.
- Walk-in orders require a valid `customerId` and at least one item.
- Stock is verified at order creation: if requested quantity exceeds stock, order is rejected.
- Orders can only be cancelled while in `PENDING` status. Fulfilled orders cannot be cancelled.

## 8. Acceptance Criteria

- **Scenario:** Visibility of Online Orders (Workflow 1 Step 2)
  - Given an online order placed by customer in E-Commerce B, When Sales staff opens Orders list, Then the order appears with source `ONLINE`, status `PENDING`, and customer contact information [SAL-04, SAL-05].
- **Scenario:** Create Walk-in Order
  - Given an in-store customer and product with stock = 5, When Sales staff submits walk-in order for 1 unit, Then order is created with `source = INTERNAL`, status `PENDING`, and unique order number [SAL-06, SAL-07, SAL-08].
- **Scenario:** Walk-in Order Out of Stock
  - Given a product with stock = 0, When Sales attempts to add it to walk-in order, Then submission is blocked [SAL-07].
- **Scenario:** Sales Cancels Pending Order
  - Given a `PENDING` order, When Sales triggers cancellation, Then status updates to `CANCELLED` [SAL-09].

## 9. Test Cases

- `TC-SAL-01`: Query orders with `source=ONLINE` -> Returns only online orders.
- `TC-SAL-02`: Create walk-in customer -> 201 Created with `userId = null`.
- `TC-SAL-03`: Create walk-in order with sufficient stock -> 201 Created, `source=INTERNAL`.
- `TC-SAL-04`: Create walk-in order with insufficient stock -> 400 Bad Request.
- `TC-SAL-05`: Cancel pending order -> 200 OK, status CANCELLED.
- `TC-SAL-06`: Cancel fulfilled order -> 400 Bad Request.

## 10. Dependencies on Other Modules

- Receives online orders from E-Commerce B (Member 2).
- Walk-in and online orders feed into ERP Inventory for fulfillment (Member 4).
- Customer master database shared across all ERP modules.
