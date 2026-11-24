# API Spec: Staff Orders & Sales (`/api/orders`, `/api/customers`)

## 1. `GET /api/orders`

List orders across all departments with filters.

- **Role:** `SALES`, `ADMIN`, `INVENTORY`, `FINANCE`
- **Query Parameters:**
  - `status`: `PENDING`, `FULFILLED`, `CANCELLED`
  - `source`: `ONLINE`, `INTERNAL`
  - `paymentStatus`: `UNPAID`, `PAID`
  - `search`: search by orderNumber or customer name
  - `page`, `limit`

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "orderNumber": "VEL-2026-0010",
      "customer": { "id": 1, "name": "Jane Doe", "phone": "+639179998888" },
      "source": "ONLINE",
      "status": "PENDING",
      "paymentStatus": "UNPAID",
      "total": "185.00",
      "createdAt": "2026-11-24T12:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

---

## 2. `POST /api/orders` (Walk-In Order Creation)

Create an internal walk-in customer order. Checks available stock and recalculates totals from DB.

- **Role:** `SALES`, `ADMIN`

### Request Body (JSON)

```json
{
  "customerId": 2,
  "items": [{ "productId": 1, "quantity": 1 }],
  "paymentMethod": "COD"
}
```

### Response `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 11,
    "orderNumber": "VEL-2026-0011",
    "source": "INTERNAL",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "total": "185.00",
    "createdById": 2
  }
}
```

---

## 3. `GET /api/orders/:id`

Full details of an order including line items and customer information.

- **Role:** `SALES`, `ADMIN`, `INVENTORY`, `FINANCE`

### Response `200 OK`

Returns full order object with customer, items, and timestamps.

---

## 4. `POST /api/orders/:id/cancel`

Cancel an order while still `PENDING`.

- **Role:** `SALES`, `ADMIN`

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 10,
    "status": "CANCELLED"
  }
}
```
