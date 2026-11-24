# 02 — Department & Module Overview

## 1. System Modules

| Module                        | Scope                                              | Primary Users     | Department / Role    |
| ----------------------------- | -------------------------------------------------- | ----------------- | -------------------- |
| Foundation                    | Authentication, Authorization, Layout, Admin Users | All users / Admin | `ADMIN`, System      |
| E-Commerce Catalog & Cart     | Storefront catalog, search, filter, cart           | Customers         | `CUSTOMER` (Public)  |
| E-Commerce Account & Checkout | Profile, auth, checkout, order tracking            | Customers         | `CUSTOMER`           |
| ERP Sales                     | Customers, order view, walk-in orders              | Sales staff       | `SALES`, `ADMIN`     |
| ERP Inventory & Warehouse     | Products, categories, restock, fulfill orders      | Inventory staff   | `INVENTORY`, `ADMIN` |
| ERP Finance                   | Payment recording, revenue tracking                | Finance staff     | `FINANCE`, `ADMIN`   |

_Full module specifications are maintained in `specs/<module>/spec.md`._
