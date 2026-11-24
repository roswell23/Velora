# Database Design Documentation

This folder contains the complete centralized database architecture for VÉLORA:

- [`erd.md`](./erd.md): Complete Mermaid Entity-Relationship Diagram (ERD), table specifications, field types, constraints, and relational invariants.

## Summary of Tables (10 Tables)

1. `User` — Staff and customer user accounts with Argon2id password hashes and role assignments.
2. `Customer` — Customer master records (online customer linked to `User`, or walk-in records).
3. `Category` — Fragrance olfactory categories.
4. `Product` — Perfume items, SKUs, pricing, stock levels, and reorder levels.
5. `Order` — Orders originating from online boutique or internal walk-ins, with status and payment tracking.
6. `OrderItem` — Snapshotted line items with purchased unit prices and quantities.
7. `Payment` — Cash on Delivery (COD) payment collection receipts tied 1-to-1 to fulfilled orders.
8. `StockMovement` — Immutable audit trail of all inventory alterations (`STOCK_IN`, `SALE`, `ADJUSTMENT`).
9. `PasswordResetToken` — Secure SHA-256 hashed single-use 30-minute expiration tokens.
10. `AuditLog` — System-level administrative audit trail.
