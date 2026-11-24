# API Spec: Finance & Payments (`/api/payments`, `/api/finance`)

## 1. `POST /api/payments` (Workflow 1 Step 5)

Records payment for a fulfilled order. Only allowed on orders with `status === 'FULFILLED'` and `paymentStatus === 'UNPAID'`.

- **Role:** `FINANCE`, `ADMIN`

### Request Body (JSON)

```json
{
  "orderId": 10,
  "amount": "185.00",
  "method": "CASH",
  "referenceNo": "REC-2026-1044"
}
```

### Response `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": 10,
    "amount": "185.00",
    "method": "CASH",
    "referenceNo": "REC-2026-1044",
    "paidAt": "2026-11-24T12:45:00.000Z",
    "recordedById": 4,
    "order": {
      "id": 10,
      "orderNumber": "VEL-2026-0010",
      "paymentStatus": "PAID"
    }
  }
}
```

### Errors

- `400 Bad Request`: Order is not in `FULFILLED` status (`ORDER_NOT_FULFILLED`).
- `400 Bad Request`: Order is already `PAID` (`ORDER_ALREADY_PAID`).
- `400 Bad Request`: Payment amount does not equal order total (`AMOUNT_MISMATCH`).

---

## 2. `GET /api/payments`

List and search payment records.

- **Role:** `FINANCE`, `ADMIN`
- **Query Parameters:** `search`, `page`, `limit`

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderId": 10,
      "orderNumber": "VEL-2026-0010",
      "amount": "185.00",
      "method": "CASH",
      "referenceNo": "REC-2026-1044",
      "paidAt": "2026-11-24T12:45:00.000Z",
      "recordedBy": { "id": 4, "name": "Fiona Finance" }
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

---

## 3. `GET /api/finance/dashboard`

Aggregated financial overview metrics.

- **Role:** `FINANCE`, `ADMIN`

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "totalRevenue": "18500.00",
    "unpaidTotal": "1450.00",
    "inventoryPurchaseCost": "9850.00",
    "paidOrdersCount": 85,
    "unpaidFulfilledOrdersCount": 6
  }
}
```

_Note: `totalRevenue` sums orders where `paymentStatus = 'PAID'`. `inventoryPurchaseCost` sums `quantity * unitCost` from `StockMovement` where `type = 'STOCK_IN'`._

---

## 4. `GET /api/finance/revenue`

Revenue breakdown by period (day or month).

- **Role:** `FINANCE`, `ADMIN`
- **Query Parameters:**
  - `groupBy`: `day` | `month` (default `day`)
  - `startDate`: ISO date string (optional)
  - `endDate`: ISO date string (optional)

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    { "period": "2026-11-24", "revenue": "185.00", "orderCount": 1 },
    { "period": "2026-11-23", "revenue": "540.00", "orderCount": 3 }
  ]
}
```
