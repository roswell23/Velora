# API Spec: Customer Orders & Profile (`/api/my`)

## 1. `GET /api/my/profile`

Fetch current customer details.

- **Role:** `CUSTOMER` (Ownership enforced on `req.user.id`)

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+639171234567",
    "address": "123 Elegance Ave, Makati City"
  }
}
```

---

## 2. `PUT /api/my/profile`

Update customer profile.

- **Role:** `CUSTOMER`

### Request Body (JSON)

```json
{
  "name": "Jane Doe",
  "phone": "+639179998888",
  "address": "Penthouse B, 456 Luxury Blvd, BGC, Taguig"
}
```

### Response `200 OK`

Returns updated customer profile.

---

## 3. `POST /api/my/orders` (Workflow 1 Step 1)

Places an online order. Re-validates stock and calculates totals directly from database product prices. Fixed to `COD`.

- **Role:** `CUSTOMER`

### Request Body (JSON)

```json
{
  "items": [{ "productId": 1, "quantity": 1 }],
  "deliveryAddress": "Penthouse B, 456 Luxury Blvd, BGC, Taguig",
  "phone": "+639179998888"
}
```

### Response `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 10,
    "orderNumber": "VEL-2026-0010",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "paymentMethod": "COD",
    "source": "ONLINE",
    "total": "185.00",
    "deliveryAddress": "Penthouse B, 456 Luxury Blvd, BGC, Taguig",
    "createdAt": "2026-11-24T12:00:00.000Z",
    "items": [
      {
        "id": 15,
        "productId": 1,
        "productName": "Santal Royale",
        "unitPrice": "185.00",
        "quantity": 1,
        "lineTotal": "185.00"
      }
    ]
  }
}
```

### Errors

- `400 Bad Request`: `INSUFFICIENT_STOCK` (Product stock lower than requested quantity).
- `400 Bad Request`: Inactive product ordered.

---

## 4. `GET /api/my/orders`

List orders placed by the authenticated customer.

- **Role:** `CUSTOMER` (Filtered strictly by `customerId`)

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "orderNumber": "VEL-2026-0010",
      "status": "PENDING",
      "paymentStatus": "UNPAID",
      "total": "185.00",
      "createdAt": "2026-11-24T12:00:00.000Z",
      "itemCount": 1
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

---

## 5. `GET /api/my/orders/:id`

Customer order details and status tracker view.

- **Role:** `CUSTOMER` (403 if order does not belong to customer)

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 10,
    "orderNumber": "VEL-2026-0010",
    "status": "FULFILLED",
    "paymentStatus": "UNPAID",
    "paymentMethod": "COD",
    "source": "ONLINE",
    "total": "185.00",
    "deliveryAddress": "Penthouse B, 456 Luxury Blvd, BGC, Taguig",
    "createdAt": "2026-11-24T12:00:00.000Z",
    "fulfilledAt": "2026-11-24T12:15:00.000Z",
    "items": [
      {
        "id": 15,
        "productId": 1,
        "productName": "Santal Royale",
        "unitPrice": "185.00",
        "quantity": 1,
        "lineTotal": "185.00"
      }
    ]
  }
}
```

---

## 6. `POST /api/my/orders/:id/cancel`

Allows customer to cancel order while status is strictly `PENDING`.

- **Role:** `CUSTOMER`

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 10,
    "orderNumber": "VEL-2026-0010",
    "status": "CANCELLED"
  }
}
```

### Errors

- `400 Bad Request`: `ORDER_NOT_CANCELLABLE` (Order already FULFILLED or CANCELLED).
- `403 Forbidden`: Attempting to cancel another customer's order.
