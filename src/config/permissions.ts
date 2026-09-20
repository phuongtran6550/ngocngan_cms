const SETTINGS_MANAGE_PERMISSION = "zalo.manage";

export const PERMISSIONS = Object.freeze({
  dashboardView: "dashboard.view",
  productsView: "products.view",
  printDevicesView: "print-devices.view",
  profileView: "profile.view",
  exportOrders: "export.orders",
  ordersView: "orders.view",
  ordersCreate: "orders.create",
  ordersUpdate: "orders.update",
  ordersDelete: "orders.delete",
  customersView: "customers.view",
  warehouseView: "warehouse.view",
  warehouseCreate: "warehouse.create",
  warehouseUpdate: "warehouse.update",
  warehouseDelete: "warehouse.delete",
  sourceGoodsView: "source-goods.view",
  sourceGoodsDelete: "source-goods.delete",
  categoriesView: "categories.view",
  categoriesCreate: "categories.create",
  categoriesUpdate: "categories.update",
  categoriesDelete: "categories.delete",
  materialsView: "materials.view",
  materialsCreate: "materials.create",
  materialsUpdate: "materials.update",
  materialsDelete: "materials.delete",
  rolesManage: "roles.manage",
  usersManage: "users.manage",
  settingsManage: SETTINGS_MANAGE_PERMISSION,
  zaloManage: SETTINGS_MANAGE_PERMISSION,
} as const);

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type PermissionRequirement = string | readonly string[];

export function normalizePermissions(permissions: string[] = []): string[] {
  return [...new Set(
    permissions
      .map((permission) => String(permission).trim())
      .filter(Boolean),
  )];
}

export function canAccess(
  permissions: string[],
  required?: PermissionRequirement,
  role?: string,
): boolean {
  if (!required || role === "ADMINISTRATOR") return true;
  const granted = new Set(normalizePermissions(permissions));
  const requirements = Array.isArray(required) ? required : [required];
  return requirements.every((permission) => granted.has(permission));
}
