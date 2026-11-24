# Spec: E-Commerce B — Customer Account, Checkout & Orders

Owner: Member 2 Status: Approved Version: 1.0

## 1. Purpose

Manage customer identity, profile information, authenticated checkout using Cash on Delivery (COD), order placement with backend stock and price verification, order history, and self-service order tracking and cancellation.

## 2. Roles and Permissions

- **`CUSTOMER`:** Access to own profile (`/api/my/profile`), order placement (`POST /api/my/orders`), viewing own order history and order details (`/api/my/orders`), and cancelling own orders while `PENDING`.
- **Strict Ownership Isolation:** Every `/api/my/*` endpoint enforces `req.user.id == target.userId`. Customers can never access another customer's orders or profile.

## 3. Requirements

| ID     | Requirement                                                                                                                      | Priority |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| ECB-01 | Customer can view and update their profile details (name, phone, delivery address).                                              | Must     |
| ECB-02 | Authenticated checkout displays pre-filled delivery information, cart items, line subtotals, and total.                          | Must     |
| ECB-03 | Payment method is fixed to Cash on Delivery (COD); no external gateways.                                                         | Must     |
| ECB-04 | Backend order submission validates sufficient stock for every line item inside a database transaction.                           | Must     |
| ECB-05 | Backend order submission recalculates all line totals and order total from database `Product.unitPrice`, ignoring client prices. | Must     |
| ECB-06 | Placed order is created with `status = PENDING`, `paymentStatus = UNPAID`, `source = ONLINE`, and unique `orderNumber`.          | Must     |
| ECB-07 | Customer order history lists past orders sorted by newest first, showing date, order number, total, and status badge.            | Must     |
| ECB-08 | Customer order detail page provides visual status progression tracker (Pending -> Fulfilled / Cancelled).                        | Must     |
| ECB-09 | Customer can cancel own order if and only if order status is strictly `PENDING`.                                                 | Must     |

## 4. Data Used

| Table       | Fields Read                                                                                  | Fields Written                                                                                                | Notes                                                      |
| ----------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `Customer`  | `id`, `userId`, `name`, `phone`, `email`, `address`                                          | `name`, `phone`, `address`                                                                                    | Linked 1:1 with User                                       |
| `Product`   | `id`, `name`, `unitPrice`, `stock`, `isActive`                                               | None                                                                                                          | Read during checkout transaction to verify price and stock |
| `Order`     | `id`, `orderNumber`, `customerId`, `source`, `status`, `paymentStatus`, `total`, `createdAt` | `orderNumber`, `customerId`, `source`, `status`, `paymentStatus`, `paymentMethod`, `deliveryAddress`, `total` | Created on checkout                                        |
| `OrderItem` | All fields                                                                                   | `orderId`, `productId`, `productName`, `unitPrice`, `quantity`, `lineTotal`                                   | Snapshotted line items                                     |

## 5. API Endpoints

- `GET /api/my/profile` — `CUSTOMER`; retrieves customer profile.
- `PUT /api/my/profile` — `CUSTOMER`; updates customer profile.
- `POST /api/my/orders` — `CUSTOMER`; places online order inside transaction.
- `GET /api/my/orders` — `CUSTOMER`; lists customer's past orders.
- `GET /api/my/orders/:id` — `CUSTOMER`; retrieves full details and status of specific order.
- `POST /api/my/orders/:id/cancel` — `CUSTOMER`; cancels order if status is `PENDING`.

## 6. UI Pages and Behavior

- **Profile Page (`/profile`):**
  - Form displaying Name, Email (read-only), Phone, Delivery Address.
  - Save Changes button with success toast.
- **Checkout Page (`/checkout`):**
  - Step 1: Delivery Address (pre-filled from profile, editable for order snapshot).
  - Step 2: Contact Phone Number.
  - Step 3: Payment Method card (fixed badge: "Cash on Delivery (COD)").
  - Order Summary sidebar showing product thumbnails, quantities, unit prices, and Total.
  - "Place Order" button with loading state.
  - Redirects to Order Confirmation page with order number upon success.
- **Orders List Page (`/orders`):**
  - Card/table list of past orders with status badges (`Pending`, `Fulfilled`, `Cancelled`).
  - "View Details" link for each order.
- **Order Tracker Page (`/orders/:id`):**
  - Visual 3-step timeline (Order Placed -> Fulfilled -> Paid).
  - Snapshotted delivery address and item breakdown.
  - "Cancel Order" button visible only if order is `PENDING`. Confirmation modal before action.

## 7. Business Rules and Validations

- Frontend totals are never trusted; backend calculates:
  `lineTotal = quantity * Product.unitPrice`, `orderTotal = SUM(lineTotal)`.
- If any ordered item has `stock < requestedQuantity`, transaction aborts with `400 Bad Request` (`INSUFFICIENT_STOCK`).
- Cancellation allowed only while `status === 'PENDING'`. Once status transitions to `FULFILLED`, cancellation is rejected with `400 Bad Request`.
- Strict customer ownership: querying `/api/my/orders/:id` for an order belonging to another customer returns `403 Forbidden`.

## 8. Acceptance Criteria

- **Scenario:** Successful Checkout (Workflow 1 Step 1)
  - Given authenticated customer with 2 bottles of Santal Royale in cart, When submitting checkout, Then order is created with status `PENDING`, `paymentStatus = UNPAID`, `source = ONLINE`, and returns 201 [ECB-04, ECB-05, ECB-06].
- **Scenario:** Insufficient Stock Rejection
  - Given product with stock = 1, When customer requests quantity = 2, Then order placement fails with 400 Bad Request and zero database mutations [ECB-04].
- **Scenario:** Customer Order Cancellation
  - Given an order in `PENDING` status, When customer clicks Cancel, Then status changes to `CANCELLED` [ECB-09].
- **Scenario:** Cancel Fulfilled Order Rejected
  - Given an order in `FULFILLED` status, When customer attempts to cancel, Then backend rejects with 400 Bad Request [ECB-09].
- **Scenario:** Ownership Isolation
  - Given Customer A and an order belonging to Customer B, When Customer A requests `/api/my/orders/:orderBId`, Then server returns 403 Forbidden [ECB-01].

## 9. Test Cases

- `TC-ECB-01`: Customer places order with sufficient stock -> 201 Created with orderNumber.
- `TC-ECB-02`: Customer places order with insufficient stock -> 400 Bad Request (`INSUFFICIENT_STOCK`).
- `TC-ECB-03`: Customer views own orders -> Returns list containing only customer's orders.
- `TC-ECB-04`: Customer cancels pending order -> 200 OK, status updated to CANCELLED.
- `TC-ECB-05`: Customer cancels fulfilled order -> 400 Bad Request.
- `TC-ECB-06`: Customer queries another customer's order ID -> 403 Forbidden.

## 10. Dependencies on Other Modules

- Receives cart from E-Commerce A (Member 1).
- Newly created orders are picked up by ERP Sales (Workflow 1 Step 2) and ERP Inventory (Workflow 1 Step 3).
