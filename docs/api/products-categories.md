# API Spec: Products & Categories (`/api/products`, `/api/categories`)

## 1. `GET /api/categories`

List all fragrance categories.

- **Role:** Public (Customer & Staff)

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Woody",
      "description": "Warm and opulent cedar, sandalwood, and oud notes."
    },
    {
      "id": 2,
      "name": "Floral",
      "description": "Romantic blends of rose, jasmine, and orange blossom."
    }
  ]
}
```

---

## 2. `POST /api/categories`

Create a category.

- **Role:** `INVENTORY`, `ADMIN`

### Request Body (JSON)

```json
{
  "name": "Oriental",
  "description": "Rich vanilla, amber, and spice blends."
}
```

### Response `201 Created`

```json
{
  "success": true,
  "data": { "id": 3, "name": "Oriental", "description": "..." }
}
```

---

## 3. `GET /api/products`

Search and filter products catalog.

- **Role:** Public (Customer sees only `isActive=true`; Staff can view all with query `includeInactive=true`)
- **Query Parameters:**
  - `search` (string): keyword matching name or brand
  - `categoryId` (int): filter by category ID
  - `minPrice` (number): minimum price filter
  - `maxPrice` (number): maximum price filter
  - `sort` (string): `price_asc`, `price_desc`, `newest` (default)
  - `page` (int, default 1), `limit` (int, default 12)

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sku": "VEL-WOOD-001",
      "name": "Santal Royale",
      "brand": "VÉLORA Atelier",
      "description": "Australian sandalwood layered with dark cardamom and leather.",
      "imageUrl": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539",
      "size": "100ml",
      "unitPrice": "185.00",
      "stock": 14,
      "reorderLevel": 5,
      "stockStatus": "IN_STOCK",
      "category": { "id": 1, "name": "Woody" }
    }
  ],
  "meta": { "page": 1, "limit": 12, "total": 1, "totalPages": 1 }
}
```

---

## 4. `GET /api/products/best-sellers`

List up to 4 active products ranked by units included in fulfilled orders. Pending and cancelled orders do not count. The response includes `unitsSold`; an empty array is returned until at least one order is fulfilled.

- **Role:** Public
- **Response `200 OK`:** Standard success envelope containing product records (including category) and `unitsSold`, sorted from highest to lowest.

---

## 5. `GET /api/products/:id`

Fetch single product details.

- **Role:** Public

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "sku": "VEL-WOOD-001",
    "name": "Santal Royale",
    "brand": "VÉLORA Atelier",
    "description": "Australian sandalwood layered with dark cardamom and leather.",
    "imageUrl": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539",
    "size": "100ml",
    "unitPrice": "185.00",
    "stock": 14,
    "reorderLevel": 5,
    "stockStatus": "IN_STOCK",
    "category": { "id": 1, "name": "Woody" }
  }
}
```

---

## 6. `POST /api/products`

Create a new product.

- **Role:** `INVENTORY`, `ADMIN`

### Request Body (JSON)

```json
{
  "categoryId": 1,
  "sku": "VEL-WOOD-002",
  "name": "Oud Mystère",
  "brand": "VÉLORA Atelier",
  "description": "Smoky Cambodian oud with Bulgarian damask rose.",
  "imageUrl": "https://images.unsplash.com/photo-1547887537-6158d64c35b3",
  "size": "50ml",
  "unitPrice": "240.00",
  "stock": 10,
  "reorderLevel": 4
}
```

### Response `201 Created`

Returns created product with `201 Created`.

---

## 7. `PUT /api/products/:id`

Update product details. The inventory product details modal uses this endpoint to update the selling price.

- **Role:** `INVENTORY`, `ADMIN`
- **Request:** Any supported fields from the product update schema; all fields are optional.

### Request Body (JSON)

```json
{
  "unitPrice": 195.00
}
```

### Response `200 OK`

Returns the updated product, including its current category and selling price. Existing order item prices and stock movement unit costs are unchanged.
