# API Spec: Inventory & Warehouse (`/api/inventory`, `/api/orders/:id/fulfill`)

## 1. `POST /api/inventory/stock-in` (Workflow 2 Step 2)

Restock existing product. Increases stock and writes immutable `STOCK_IN` movement.

- **Role:** `INVENTORY`, `ADMIN`

### Request Body (JSON)

```json
{
  "productId": 1,
  "quantity": 20,
  "unitCost": "95.00",
  "supplier": "Grasse Atelier Distillers",
  "notes": "Q4 batch shipment"
}
```

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "productId": 1,
    "newStock": 34,
    "movement": {
      "id": 5,
      "type": "STOCK_IN",
      "quantity": 20,
      "unitCost": "95.00",
      "reason": "Supplier: Grasse Atelier Distillers. Note: Q4 batch shipment"
    }
  }
}
```

---

## 2. `POST /api/inventory/adjust`

Adjust stock quantity up or down with mandatory reason.

- **Role:** `INVENTORY`, `ADMIN`

### Request Body (JSON)

```json
{
  "productId": 1,
  "quantityDelta": -1,
  "reason": "Damaged bottle during shelf audit"
}
```

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "productId": 1,
    "newStock": 33,
    "movement": {
      "id": 6,
      "type": "ADJUSTMENT",
      "quantity": -1,
      "reason": "Damaged bottle during shelf audit"
    }
  }
}
```

### Errors

- `400 Bad Request`: `STOCK_NEGATIVE` (Adjustment would result in stock < 0).

---

## 3. `GET /api/inventory/low-stock`

Fetch products where `stock <= reorderLevel`.

- **Role:** `INVENTORY`, `ADMIN`

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "sku": "VEL-FLOR-002",
      "name": "Fleur de Soie",
      "stock": 2,
      "reorderLevel": 5,
      "unitPrice": "160.00"
    }
  ]
}
```

---

## 4. `GET /api/inventory/movements`

Audit trail of stock movements.

- **Role:** `INVENTORY`, `ADMIN`, `FINANCE`
- **Query Parameters:** `productId`, `type`, `page`, `limit`

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "productId": 1,
      "product": { "sku": "VEL-WOOD-001", "name": "Santal Royale" },
      "type": "STOCK_IN",
      "quantity": 20,
      "unitCost": "95.00",
      "reason": "Supplier: Grasse Atelier Distillers",
      "performedBy": { "id": 3, "name": "Ian Inventory" },
      "createdAt": "2026-11-24T12:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

---

## 5. `POST /api/orders/:id/fulfill` (Workflow 1 Step 3)

Fulfill order in a single transaction: validates stock, deducts stock, writes `SALE` movements, and marks order `FULFILLED`.

- **Role:** `INVENTORY`, `ADMIN`

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 10,
    "orderNumber": "VEL-2026-0010",
    "status": "FULFILLED",
    "fulfilledAt": "2026-11-24T12:15:00.000Z",
    "fulfilledById": 3
  }
}
```

### Errors

- `400 Bad Request`: `INSUFFICIENT_STOCK` (Stock level is lower than ordered quantity; transaction rolls back completely).
- `400 Bad Request`: `INVALID_ORDER_STATUS` (Order is not in PENDING status).
