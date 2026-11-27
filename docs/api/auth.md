# API Spec: Authentication & Session (`/api/auth`)

## 1. `POST /api/auth/register/send-code`

Sends a single-use 6-digit verification code to the customer's email address (10-minute TTL) via Brevo before completing registration.

- **Role:** Public (No login required)
- **Rate Limit:** 5 requests per 15 minutes per IP.

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
    "message": "A 6-digit verification code has been sent to your email."
  }
}
```

### Errors

- `400 Bad Request` (`VALIDATION_ERROR`): Invalid email format.
- `409 Conflict` (`EMAIL_EXISTS`): Email already in use.
- `429 Too Many Requests` (`RATE_LIMITED`): Too many verification requests.

---

## 2. `POST /api/auth/register`

Verifies the 6-digit email verification code, creates a new customer account, and automatically generates a linked `Customer` record.

- **Role:** Public (No login required)

### Request Body (JSON)

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "phone": "+639171234567",
  "address": "123 Elegance Ave, Makati City",
  "verificationCode": "482910"
}
```

- `name` (string, required, 2–100 chars)
- `email` (string, required, valid email)
- `password` (string, required, min 8 chars)
- `phone` (string, required, 7–30 chars)
- `address` (string, optional, 5–500 chars when provided)
- `verificationCode` (string, required, 6 digits)

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

- `400 Bad Request`: Password < 8 characters, invalid format, or invalid/expired `verificationCode` (`INVALID_OR_EXPIRED_CODE`).
- `409 Conflict`: Email already in use (`EMAIL_EXISTS`).

---

## 2. `POST /api/auth/login`

Customer login endpoint. Strictly rejects non-CUSTOMER roles.

- **Role:** Public
- **Rate Limit:** Five consecutive invalid credentials for the same email lock this endpoint for 10 minutes. A secondary IP limit allows 30 requests per 15 minutes.

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

- `400 Bad Request` (`VALIDATION_ERROR`): Invalid request data (`details` array with `{ field, issue }`).
- `401 Unauthorized`: Generic message `"Invalid email or password."` (used for incorrect credentials or if a staff member attempts customer login).
- `403 Forbidden` (`ACCOUNT_DEACTIVATED`): `"This account has been deactivated."`
- `429 Too Many Requests` (`RATE_LIMITED`): Too many requests from this IP.
- `429 Too Many Requests` (`LOGIN_LOCKED`): Five consecutive invalid credentials; retry after 10 minutes. Includes `Retry-After` and `details.retryAfterSeconds`.

---

## 3. `POST /api/auth/staff-login`

Staff login endpoint for ERP Portal. Rejects `CUSTOMER` role.

- **Role:** Public
- **Rate Limit:** Five consecutive invalid credentials for the same email lock this endpoint for 10 minutes. A secondary IP limit allows 30 requests per 15 minutes.

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
- `429 Too Many Requests` (`LOGIN_LOCKED`): Five consecutive invalid credentials; retry after 10 minutes. Includes `Retry-After` and `details.retryAfterSeconds`.

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

Resets password with either a valid single-use 6-digit customer code (`email` + `code`) or a staff reset token (`token`) within 30 minutes.

- **Role:** Public

### Request Body (JSON — Customer 6-digit Code)

```json
{
  "email": "jane@example.com",
  "code": "482910",
  "newPassword": "NewStrongPassword123!"
}
```

### Request Body (JSON — Staff Reset Token)

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
