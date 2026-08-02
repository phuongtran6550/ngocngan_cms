import {
  PERMISSIONS,
  canAccess,
  type PermissionRequirement,
} from "@/config/permissions";
import { visibleNavigation } from "@/config/navigation";
import type { AuthMenuItem } from "@/views/Account/types";

export interface GlobalSearchTarget {
  path: string;
  permission: PermissionRequirement;
}

export const globalSearchTargets: readonly GlobalSearchTarget[] = Object.freeze(
  [
    { path: "/orders", permission: PERMISSIONS.ordersView },
    { path: "/products", permission: PERMISSIONS.warehouseView },
    { path: "/warehoused-goods", permission: PERMISSIONS.warehouseView },
    { path: "/customers", permission: PERMISSIONS.customersView },
    { path: "/customers/history", permission: PERMISSIONS.customersView },
    { path: "/categories", permission: PERMISSIONS.categoriesView },
    { path: "/materials", permission: PERMISSIONS.materialsView },
    { path: "/patterns", permission: PERMISSIONS.categoriesView },
    { path: "/source-of-goods", permission: PERMISSIONS.sourceGoodsView },
    { path: "/users", permission: PERMISSIONS.usersManage },
    { path: "/roles", permission: PERMISSIONS.rolesManage },
  ],
);

export function searchQueryFromRoute(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function globalSearchTarget(
  currentPath: string,
  permissions: string[],
  role?: string,
  menu?: AuthMenuItem[],
): string | null {
  const runtimePaths = new Set(
    visibleNavigation(permissions, role, menu)
      .map((entry) => entry.path)
      .filter((path): path is string => Boolean(path)),
  );
  const available = globalSearchTargets.filter(
    (target) =>
      canAccess(permissions, target.permission, role) &&
      (!menu?.length ||
        [...runtimePaths].some(
          (path) => target.path === path || target.path.startsWith(`${path}/`),
        )),
  );
  const current = available.find((target) => currentPath === target.path);
  if (current) return current.path;

  // Detail/create routes search their owning list instead of redirecting elsewhere.
  return (
    available.find(
      (target) =>
        target.path !== "/customers/history" &&
        currentPath.startsWith(`${target.path}/`),
    )?.path || null
  );
}
