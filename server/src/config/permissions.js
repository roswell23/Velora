/**
 * Role Definitions and Permission Matrix
 * Source of truth for backend role-based access control.
 */

export const ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  SALES: "SALES",
  INVENTORY: "INVENTORY",
  FINANCE: "FINANCE",
};

export const STAFF_ROLES = [ROLES.ADMIN, ROLES.SALES, ROLES.INVENTORY, ROLES.FINANCE];

export const ALL_ROLES = Object.values(ROLES);
