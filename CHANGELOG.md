# Changelog

All notable changes to the VÉLORA project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Customer login (`/login`) and registration (`/register`) pages in `client/customer` (`LoginPage.jsx`, `RegisterPage.jsx`, `AuthLayout.jsx`, `useAuth.jsx`) wired to `POST /api/auth/login`, `POST /api/auth/register`, and `GET /api/auth/me` using `localStorage` (`velora_token`).
- Storefront header sign-in / signed-in state integration in `client/customer/src/App.jsx`.

## [0.2.0] - 2026-11-24

### Added

- **Phase 2: Specification**
  - High-level system architecture and cross-departmental sequence diagrams in `docs/03-architecture.md` (Workflow 1 & Workflow 2).
  - Centralized PostgreSQL ERD (Mermaid) and detailed table definitions in `docs/database/erd.md`.
  - Comprehensive REST API specifications in `docs/api/` (`auth.md`, `products-categories.md`, `orders-customer.md`, `orders-sales.md`, `inventory.md`, `payments-finance.md`, `users-customers.md`).
  - Full module specifications in `specs/`:
    - `specs/foundation/spec.md` (`AUTH`, `ADM`)
    - `specs/ecommerce-catalog/spec.md` (`ECA`)
    - `specs/ecommerce-account-checkout/spec.md` (`ECB`)
    - `specs/erp-sales/spec.md` (`SAL`)
    - `specs/erp-inventory/spec.md` (`INV`)
    - `specs/erp-finance/spec.md` (`FIN`)
  - Complete Traceability Matrix in `docs/traceability.md` mapping all 49 requirement IDs to endpoints, UI components, tests, and team owners.
  - Step-by-step Demonstration Script in `docs/demo-script.md` with oral defense scripts for both required workflows.
  - Completed cross-spec consistency review with 100% Prettier and ESLint compliance.

## [0.1.0] - 2026-11-24

### Added

- **Phase 1: Project Setup**
  - Configured npm workspaces (`client/customer`, `client/admin`, `server`).
  - Added project documentation foundation (`AGENTS.md`, `README.md`, `CHANGELOG.md`).
  - Configured backend environment variable template (`server/.env.example`).
  - Created module specification templates in `specs/` (`foundation`, `ecommerce-catalog`, `ecommerce-account-checkout`, `erp-sales`, `erp-inventory`, `erp-finance`).
  - Created documentation directories and placeholder templates in `docs/` (`01-06`, `api`, `database`, `screenshots`, `decisions.md`, `demo-script.md`, `traceability.md`).
  - Configured ESLint with React support and Prettier.
  - Scaffolded customer storefront app (`client/customer`) with Vite, React, Tailwind CSS, and Lucide React.
  - Scaffolded ERP admin portal app (`client/admin`) with Vite, React, Tailwind CSS, and Lucide React.
  - Scaffolded Express backend (`server`) with modular directory layout, security middleware stubs, and `GET /api/health` endpoint.
