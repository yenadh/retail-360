// src/lib/roles.ts

export const USER_ROLES = {
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
  INVENTORY_MANAGER: "INVENTORY_MANAGER",
  SALES_STAFF: "SALES_STAFF",
  DELIVERY_STAFF: "DELIVERY_STAFF",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ADMIN_ALLOWED_ROLES: UserRole[] = [
  USER_ROLES.ADMIN,
  USER_ROLES.INVENTORY_MANAGER,
  USER_ROLES.SALES_STAFF,
  USER_ROLES.DELIVERY_STAFF,
];

export const ROUTE_ROLE_ACCESS: Record<string, UserRole[]> = {
  "/admin/dashboard": [
    USER_ROLES.ADMIN,
    USER_ROLES.INVENTORY_MANAGER,
    USER_ROLES.SALES_STAFF,
    USER_ROLES.DELIVERY_STAFF,
  ],

  "/admin/products": [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER],
  "/admin/category": [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER],
  "/admin/inventory": [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER],
  "/admin/suppliers": [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER],

  "/admin/orders": [USER_ROLES.ADMIN, USER_ROLES.SALES_STAFF],
  "/admin/payments": [USER_ROLES.ADMIN, USER_ROLES.SALES_STAFF],

  "/admin/deliveries": [USER_ROLES.ADMIN, USER_ROLES.DELIVERY_STAFF],

  "/admin/reports": [USER_ROLES.ADMIN],

  "/admin/users": [USER_ROLES.ADMIN],
};
