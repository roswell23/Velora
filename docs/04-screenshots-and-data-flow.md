# 04 — Screenshots & Data Flow

## 1. Screenshot evidence

Screenshots are not yet available. Capture these views during the manual demo after starting the API, both frontends, and a seeded database. Store images in `docs/screenshots/` and replace this checklist with links and brief captions.

- [ ] Customer storefront and catalog filters
- [ ] Product detail, stock badge, and cart
- [ ] Checkout confirmation and customer order tracker
- [ ] ERP Sales online order and order details
- [ ] ERP Inventory low-stock view and fulfillment result
- [ ] ERP Finance unpaid order, recorded payment, and revenue summary
- [ ] Inventory stock-in movement and updated product stock
- [ ] Finance procurement cost after stock-in

## 2. Cross-departmental data flow

### Workflow 1 — Online order to payment

```text
Customer storefront
  -> POST /api/my/orders: validate current product prices and stock; create PENDING / UNPAID / ONLINE order
  -> ERP Sales: read the shared order and customer details
  -> ERP Inventory: fulfill in a transaction, decrement stock, add SALE movement, set FULFILLED
  -> Customer storefront: read updated order status
  -> ERP Finance: record COD payment for fulfilled order, set PAID, include in revenue
```

### Workflow 2 — Restock and cost visibility

```text
ERP Inventory
  -> POST /api/inventory/stock-in: increase stock and add STOCK_IN movement in a transaction
  -> E-Commerce catalog and ERP Sales: read updated product stock
  -> ERP Finance: aggregate purchase cost from STOCK_IN movement data
```

Both workflows use the centralized PostgreSQL database through the backend API. The request paths above are the documented integration points; successful end-to-end behavior still needs to be observed and recorded during the manual demo. See [the demonstration script](demo-script.md) for presenter steps and expected outcomes, and [the testing record](05-testing-and-issues.md) for current verification status.
