# Spec: Foundation (Auth, Roles, Layout, Admin, Seed)

Owner: Shared / Member 5 Status: Approved Version: 1.0

## 1. Purpose

Provide unified authentication (JWT, Argon2id), role-based access control (RBAC), secure single-use password reset with generic responses, administrative user management, shared ERP layout shell with role-sensitive navigation, and standardized database seed data for live demo workflows.

## 2. Roles and Permissions

- **Public:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/staff-login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
- **Authenticated (Any Valid Role):** `GET /api/auth/me`.
- **`ADMIN`:** Full CRUD access to staff user accounts (`/api/users`).
- **All other staff roles (`SALES`, `INVENTORY`, `FINANCE`):** No access to user administration.
- **`CUSTOMER`:** Access restricted to customer storefront and `/api/my/*` endpoints.

## 3. Requirements

| ID      | Requirement                                                                                                                                                                 | Priority |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AUTH-01 | Public customer registration creates `User` with role `CUSTOMER` and linked `Customer` record.                                                                              | Must     |
| AUTH-02 | Customer login via `POST /api/auth/login` verifies Argon2id hash and rejects staff roles.                                                                                   | Must     |
| AUTH-03 | Staff login via `POST /api/auth/staff-login` verifies credentials, rejects `CUSTOMER` role, and blocks deactivated users.                                                   | Must     |
| AUTH-04 | Password hashing uses Argon2id (`memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`). Minimum password length is 8 characters.                                             | Must     |
| AUTH-05 | Rate-limit login endpoints (`login`, `staff-login`: 5 req/15m) and forgot-password (3 req/15m) via `express-rate-limit`.                                                    | Must     |
| AUTH-06 | `POST /api/auth/forgot-password` returns identical generic response whether email exists or not.                                                                            | Must     |
| AUTH-07 | Password reset token is a cryptographically secure random string whose SHA-256 hash is stored in `PasswordResetToken`, expiring in 30 minutes and invalidated on first use. | Must     |
| AUTH-08 | `GET /api/auth/me` returns authenticated user identity and role.                                                                                                            | Must     |
| ADM-01  | Admin user management lists all staff users with pagination and search.                                                                                                     | Must     |
| ADM-02  | Admin can create staff accounts with assigned roles (`ADMIN`, `SALES`, `INVENTORY`, `FINANCE`).                                                                             | Must     |
| ADM-03  | Admin can update staff profile and toggle `isActive` status. Deactivated users cannot log in.                                                                               | Must     |
| ADM-04  | Database seed script seeds demo accounts for all roles, sample customers, categories, 12 perfume products (including low-stock items), and sample orders.                   | Must     |

## 4. Data Used

| Table                | Fields Read                                                    | Fields Written                                      | Notes                                     |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| `User`               | `id`, `name`, `email`, `passwordHash`, `role`, `isActive`      | `name`, `email`, `passwordHash`, `role`, `isActive` | Argon2id passwords                        |
| `Customer`           | `id`, `userId`, `name`, `phone`, `email`, `address`            | `userId`, `name`, `phone`, `email`, `address`       | Created during customer registration      |
| `PasswordResetToken` | `id`, `userId`, `tokenHash`, `expiresAt`, `usedAt`             | `userId`, `tokenHash`, `expiresAt`, `usedAt`        | Single-use, 30m TTL                       |
| `AuditLog`           | `id`, `actorId`, `action`, `entityType`, `entityId`, `details` | All fields                                          | Written on user deactivation/role changes |

## 5. API Endpoints

- `POST /api/auth/register` — Public; creates user and customer; returns JWT and user payload.
- `POST /api/auth/login` — Public; authenticates customer; returns JWT.
- `POST /api/auth/staff-login` — Public; authenticates staff; returns JWT.
- `POST /api/auth/forgot-password` — Public; initiates password reset token email.
- `POST /api/auth/reset-password` — Public; validates token hash and updates password.
- `GET /api/auth/me` — Authenticated; returns current identity.
- `GET /api/users` — `ADMIN`; lists staff accounts.
- `POST /api/users` — `ADMIN`; creates new staff account.
- `PATCH /api/users/:id` — `ADMIN`; modifies staff account or toggles active state.

## 6. UI Pages and Behavior

- **Customer Auth Pages (`client/customer`):**
  - Sign In (`/login`): Clean luxury styling, email/password fields, "Forgot Password" link.
  - Sign Up (`/register`): Fields for Name, Email, Password, Phone, Address.
  - Forgot / Reset Password (`/forgot-password`, `/reset-password?token=...`).
- **ERP Staff Auth Pages (`client/admin`):**
  - Staff Login (`/login`): Dark luxury layout, role guard notice, error toast on bad credentials.
  - Forgot / Reset Password (`/forgot-password`, `/reset-password?token=...`).
- **ERP App Layout (`client/admin`):**
  - Left navigation sidebar showing department links based strictly on `user.role`.
  - Top header displaying logged-in user name, role badge, and Logout button.
- **Admin Users Page (`/admin/users`):**
  - Data table with search, role badges, active/deactive status switch.
  - "New Staff User" modal with role dropdown and validation.

## 7. Business Rules and Validations

- Public registration can NEVER grant any staff role (`ADMIN`, `SALES`, `INVENTORY`, `FINANCE`).
- Staff logins must explicitly reject `CUSTOMER` role with 401 generic error.
- Deactivated accounts (`isActive === false`) receive 403 Forbidden on staff login.
- Reset tokens expire exactly 30 minutes after generation and become invalid immediately upon first successful reset.

## 8. Acceptance Criteria

- **Scenario:** Customer Registration
  - Given valid name, email, password, and phone, When submitting to `POST /api/auth/register`, Then user is created with role `CUSTOMER`, a linked `Customer` row is inserted, and a 201 response with JWT is returned [AUTH-01, AUTH-04].
- **Scenario:** Staff Login Role Guard
  - Given a user with role `CUSTOMER`, When attempting login at `POST /api/auth/staff-login`, Then server returns 401 Unauthorized with generic message [AUTH-03].
- **Scenario:** Deactivated User Login
  - Given a staff user with `isActive = false`, When attempting staff login, Then server rejects request with 403 Forbidden [AUTH-03, ADM-03].
- **Scenario:** Generic Forgot Password
  - Given any email address, When submitted to `POST /api/auth/forgot-password`, Then response always returns 200 OK with the exact standard generic confirmation [AUTH-06].
- **Scenario:** Reset Token Single Use
  - Given a consumed reset token (`usedAt IS NOT NULL`), When attempting another reset with the same token, Then server rejects request with 400 Bad Request [AUTH-07].

## 9. Test Cases

- `TC-AUTH-01`: Register customer account with valid data -> 201 Created with JWT.
- `TC-AUTH-02`: Register customer with existing email -> 409 Conflict.
- `TC-AUTH-03`: Customer login with correct credentials -> 200 OK with JWT.
- `TC-AUTH-04`: Customer login with staff credentials -> 401 Unauthorized.
- `TC-AUTH-05`: Staff login with valid credentials -> 200 OK with role payload.
- `TC-AUTH-06`: Staff login with deactivated account -> 403 Forbidden.
- `TC-AUTH-07`: Forgot password with unregistered email -> 200 OK generic message.
- `TC-AUTH-08`: Reset password with expired or reused token -> 400 Bad Request.
- `TC-ADM-01`: Non-admin attempts to access `GET /api/users` -> 403 Forbidden.
- `TC-ADM-02`: Admin creates new staff user -> 201 Created.

## 10. Dependencies on Other Modules

- Foundational prerequisite for all protected customer and ERP routes.
