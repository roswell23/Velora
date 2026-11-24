# 01 — Project Overview

## 1. Project Title

**VÉLORA — E-Commerce + ERP Integrated System**
_Tagline: The Essence of Elegance._

## 2. Background & Scenario

A luxury perfume business operating an online boutique for retail customers (E-Commerce) and an internal ERP management portal (Sales, Inventory & Warehouse, Finance) sharing a single centralized PostgreSQL database.

## 3. Objectives

- Provide a responsive storefront for customer browsing, ordering (COD), and self-service order tracking.
- Provide a unified ERP portal for internal staff to manage customer records, orders, inventory, fulfillment, and revenue.
- Enable end-to-end data sharing and transaction safety across online orders, fulfillment stock deductions, and payment recording.
- Maintain spec-driven traceability, architectural clarity, and defensible code for academic defense.

## 4. Scope Summary

- **In Scope:**
  - E-Commerce customer storefront (`client/customer`)
  - ERP staff portal (`client/admin`) with Sales, Inventory, Finance, and Admin user management
  - Express.js backend API (`server`)
  - Centralized PostgreSQL database (hosted on Neon)
  - Workflows: Online Order to Payment, Restock and Cost Visibility
- **Out of Scope:**
  - Online payments (COD only)
  - Refresh tokens
  - Cloudinary / Image uploads (URLs only)
  - Server-side persistent cart
  - Multiple warehouses
  - Discounts, taxes, refunds, shipping rates
  - E2E browser automation tools
