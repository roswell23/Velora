# VÉLORA REST API Specifications

## 1. Global Conventions

### 1.1 Base URL

All endpoints are served under `/api`.

### 1.2 Standard Success Envelope

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

_(The `meta` object is included on paginated list endpoints.)_

### 1.3 Standard Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters.",
    "details": [{ "field": "email", "issue": "Invalid email format" }]
  }
}
```

### 1.4 Standard HTTP Status Codes

- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or business rule violation (e.g. insufficient stock, invalid status transition).
- `401 Unauthorized`: Missing or invalid JWT token.
- `403 Forbidden`: Authenticated user lacks required role or does not own the requested resource.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Unique constraint violation (e.g., duplicate email or SKU).
- `429 Too Many Requests`: Rate limit exceeded on authentication endpoints.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. API Endpoint Directory

- [`auth.md`](./auth.md): Registration, login, staff login, password reset flow, and session inspection.
- [`products-categories.md`](./products-categories.md): Public storefront browsing, categories, and inventory catalog CRUD.
- [`orders-customer.md`](./orders-customer.md): Customer self-service checkout (`/api/my/orders`), order tracking, and order cancellation.
- [`orders-sales.md`](./orders-sales.md): Staff order search, walk-in order creation (`source=INTERNAL`), and sales order cancellation.
- [`inventory.md`](./inventory.md): Stock-in, stock adjustments, low-stock alerts, stock movement logs, and order fulfillment.
- [`payments-finance.md`](./payments-finance.md): COD payment recording, payment logs, finance dashboard metrics, and revenue breakdown.
- [`users-customers.md`](./users-customers.md): Staff user management (Admin) and customer master data management (Sales).
