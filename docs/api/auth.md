# API Spec: Authentication & Session (`/api/auth`)

## 1. `POST /api/auth/register`

Creates a new customer account and automatically generates a linked `Customer` record.

- **Role:** Public (No login required)
- **Rate Limit:** 10 requests per 15 minutes per IP

### Request Body (JSON)

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "phone": "+639171234567",
  "address": "123 Elegance Ave, Makati City"
}
```

### Response `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOi..."
  }
}
```

### Errors

- `400 Bad Request`: Password < 8 characters or invalid format.
- `409 Conflict`: Email already in use (`EMAIL_EXISTS`).

---

## 2. `POST /api/auth/login`

Customer login endpoint. Strictly rejects non-CUSTOMER roles.

- **Role:** Public
- **Rate Limit:** 5 requests per 15 minutes per IP

### Request Body (JSON)

```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOi..."
  }
}
```

### Errors

- `401 Unauthorized`: Generic message `"Invalid email or password"` (used for incorrect credentials or if a staff member attempts customer login).

---

## 3. `POST /api/auth/staff-login`

Staff login endpoint for ERP Portal. Rejects `CUSTOMER` role.

- **Role:** Public
- **Rate Limit:** 5 requests per 15 minutes per IP

### Request Body (JSON)

```json
{
  "email": "sales@velora.local",
  "password": "DemoPass123!"
}
```

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "name": "Sarah Sales",
      "email": "sales@velora.local",
      "role": "SALES"
    },
    "token": "eyJhbGciOi..."
  }
}
```

### Errors

- `401 Unauthorized`: Generic message `"Invalid email or password"`.
- `403 Forbidden`: Account deactivated (`ACCOUNT_DEACTIVATED`).

---

## 4. `POST /api/auth/forgot-password`

Initiates password reset. Always returns identical generic message regardless of email existence.

- **Role:** Public
- **Rate Limit:** 3 requests per 15 minutes per IP

### Request Body (JSON)

```json
{
  "email": "jane@example.com"
}
```

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "If that email is registered, password reset instructions have been sent."
  }
}
```

---

## 5. `POST /api/auth/reset-password`

Resets password with valid single-use token within 30 minutes.

- **Role:** Public

### Request Body (JSON)

```json
{
  "token": "a4f89d3c...",
  "newPassword": "NewStrongPassword123!"
}
```

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Your password has been reset successfully. Please log in with your new password."
  }
}
```

### Errors

- `400 Bad Request`: Token expired, invalid, or already consumed (`INVALID_OR_EXPIRED_TOKEN`).

---

## 6. `GET /api/auth/me`

Fetches authenticated user profile and permissions.

- **Role:** Authenticated (`CUSTOMER`, `ADMIN`, `SALES`, `INVENTORY`, `FINANCE`)

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "CUSTOMER"
  }
}
```
