# API Spec: Users & Customers (`/api/users`, `/api/customers`)

## 1. `GET /api/users`

List staff user accounts.

- **Role:** `ADMIN`

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Arthur Admin",
      "email": "admin@velora.local",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-11-24T00:00:00.000Z"
    }
  ]
}
```

---

## 2. `POST /api/users`

Create a new staff user.

- **Role:** `ADMIN`

### Request Body (JSON)

```json
{
  "name": "Sam Sales",
  "email": "sam@velora.local",
  "password": "TemporaryPass123!",
  "role": "SALES"
}
```

### Response `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 6,
    "name": "Sam Sales",
    "email": "sam@velora.local",
    "role": "SALES",
    "isActive": true
  }
}
```

---

## 3. `PATCH /api/users/:id`

Update a user's details or deactivate account.

- **Role:** `ADMIN`

### Request Body (JSON)

```json
{
  "name": "Sam Sales Updated",
  "role": "SALES",
  "isActive": false
}
```

### Response `200 OK`

Returns updated user object. Deactivated users cannot authenticate.

---

## 4. `GET /api/customers`

List customers (both online registered and walk-in).

- **Role:** `SALES`, `ADMIN`, `INVENTORY`, `FINANCE`
- **Query Parameters:** `search` (name, phone, email), `page`, `limit`

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+639171234567",
      "address": "Makati City",
      "type": "ONLINE"
    },
    {
      "id": 2,
      "userId": null,
      "name": "Carlos Walk-in",
      "email": null,
      "phone": "+639185551234",
      "address": null,
      "type": "WALK_IN"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 2, "totalPages": 1 }
}
```

---

## 5. `POST /api/customers`

Create walk-in customer record.

- **Role:** `SALES`, `ADMIN`

### Request Body (JSON)

```json
{
  "name": "Carlos Walk-in",
  "phone": "+639185551234",
  "email": "carlos@example.com",
  "address": "Ortigas Center, Pasig"
}
```

### Response `201 Created`

Returns created customer record with `userId = null`.
