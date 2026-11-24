# Architectural & Technical Decisions Log

This document records key design and technology decisions along with justifications.

## Decisions

### 1. Choice of Node.js + Express.js with Vanilla JavaScript (ES Modules)

- **Decision:** Use Node.js and Express with `"type": "module"` and strictly no TypeScript.
- **Justification:** Course requirement prioritizes code clarity, straightforward debugging, and ease of individual oral defense for all 5 team members without build/transpile complexity.

### 2. Zod as Single Source of Truth for Validation

- **Decision:** Use Zod for all request payload, query, and parameter validation.
- **Justification:** In the absence of static type checking, Zod guarantees runtime schema validation and prevents invalid data from reaching business logic or database layers.

### 3. PostgreSQL on Neon with Prisma ORM

- **Decision:** Centralized PostgreSQL instance with Prisma ORM located at `server/prisma/`.
- **Justification:** Neon provides serverless pooled connections for runtime efficiency and direct connections for schema migrations; Prisma simplifies relational transactions and migrations across ~10 shared tables.

### 4. Cash on Delivery (COD) Only

- **Decision:** Restrict payment method exclusively to Cash on Delivery.
- **Justification:** Avoids external third-party webhook and gateway failure modes during live school grading while preserving full business logic for order status (`PENDING` -> `FULFILLED`) and payment status (`UNPAID` -> `PAID`).
