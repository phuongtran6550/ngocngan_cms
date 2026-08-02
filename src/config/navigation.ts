import clientRoutes, {
  type ClientRoute,
  type NavigationGroupKey,
} from "@/router/client";
import administratorRoutes from "@/router/administrator";
import { canAccess, type PermissionRequirement } from "@/config/permissions";
import type { AuthMenuItem } from "@/views/Account/types";

export interface NavigationEntry {
  key: string;
  label: string;
  path?: string;
  icon: string;
  permission?: PermissionRequirement;
  children?: NavigationEntry[];
}

export interface NavigationGroup {
  key: string;
  label?: string;
  entries: NavigationEntry[];
}

const groupOrder: NavigationGroupKey[] = ["overview", "commerce", "system"];
const protectedRoutes = [...clientRoutes, ...administratorRoutes];
const routePathByName = new Map(
  protectedRoutes.map((route) => [route.name, route.path]),
);
const navigationRoutes = protectedRoutes.filter(
  (
    route,
  ): route is ClientRoute & {
    meta: ClientRoute["meta"] & {
      navigation: NonNullable<ClientRoute["meta"]["navigation"]>;
    };
  } => Boolean(route.meta.navigation),
);

interface OrderedNavigationEntry {
  entry: NavigationEntry;
  order: number;
}

function staticNavigationEntry(page: (typeof navigationRoutes)[number]): NavigationEntry {
  return {
    key: page.name,
    label: page.meta.title,
    path: page.path,
    icon: page.meta.navigation.icon,
    permission: page.meta.permission,
  };
}

function staticEntriesForGroup(groupKey: NavigationGroupKey): NavigationEntry[] {
  const pages = navigationRoutes
    .filter((page) => page.meta.navigation.group === groupKey)
    .sort((left, right) => pageNavigationOrder(left) - pageNavigationOrder(right));
  const nested = new Map<string, OrderedNavigationEntry & {
    entry: NavigationEntry & { children: NavigationEntry[] };
  }>();
  const entries: OrderedNavigationEntry[] = [];

  for (const page of pages) {
    const parent = page.meta.navigation.parent;
    if (!parent) {
      entries.push({ entry: staticNavigationEntry(page), order: pageNavigationOrder(page) });
      continue;
    }

    let parentEntry = nested.get(parent.key);
    if (!parentEntry) {
      parentEntry = {
        order: parent.order,
        entry: { key: parent.key, label: parent.label, icon: parent.icon, children: [] },
      };
      nested.set(parent.key, parentEntry);
      entries.push(parentEntry);
    }
    parentEntry.entry.children.push(staticNavigationEntry(page));
  }

  return entries
    .sort((left, right) => left.order - right.order)
    .map(({ entry }) => entry);
}

export const navigationGroups: NavigationGroup[] = groupOrder
  .map((groupKey) => {
    const pages = navigationRoutes.filter((page) => page.meta.navigation.group === groupKey);
    return {
      key: groupKey,
      label: pages[0]?.meta.navigation.groupLabel,
      entries: staticEntriesForGroup(groupKey),
    };
  })
  .filter((group) => group.entries.length > 0);

function pageNavigationOrder(page: (typeof navigationRoutes)[number]): number {
  return page.meta.navigation.order;
}

function runtimeLabel(item: AuthMenuItem): string {
  return item.title || item.label || item.lable || item.name || item.link || "Menu";
}

function runtimeKey(item: AuthMenuItem, lineage: string): string {
  const value = item.id || item.key || item.link || item.route || item.path || item.url || runtimeLabel(item);
  return `${lineage}-${String(value).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function runtimePath(item: AuthMenuItem): string | undefined {
  const routeName = item.link || item.route || item.name;
  const routePath = routeName ? routePathByName.get(routeName) : undefined;
  if (routePath) return routePath;

  const candidate = item.path || item.url;
  return candidate ? internalRedirectTarget(candidate) : undefined;
}

function runtimeEntry(item: AuthMenuItem, lineage: string): NavigationEntry | undefined {
  const children = (item.children || [])
    .map((child, index) => runtimeEntry(child, `${lineage}-${index}`))
    .filter((child): child is NavigationEntry => Boolean(child));
  const path = runtimePath(item);
  if (!path && !children.length) return undefined;

  return {
    key: runtimeKey(item, lineage),
    label: runtimeLabel(item),
    path,
    icon: item.icon || "circle",
    children: children.length ? children : undefined,
  };
}

function runtimeNavigationGroups(menu: AuthMenuItem[]): NavigationGroup[] {
  const groups: NavigationGroup[] = [];
  let currentGroup: NavigationGroup = {
    key: "runtime-navigation",
    entries: [],
  };

  for (const [index, item] of menu.entries()) {
    if (item.isHeader || item.isHeadr) {
      if (currentGroup.entries.length) groups.push(currentGroup);
      currentGroup = {
        key: runtimeKey(item, `runtime-group-${index}`),
        label: runtimeLabel(item),
        entries: (item.children || [])
          .map((child, childIndex) => runtimeEntry(child, `runtime-${index}-${childIndex}`))
          .filter((child): child is NavigationEntry => Boolean(child)),
      };
      continue;
    }

    const entry = runtimeEntry(item, `runtime-${index}`);
    if (entry) currentGroup.entries.push(entry);
  }

  if (currentGroup.entries.length) groups.push(currentGroup);
  return groups.filter((group) => group.entries.length);
}

function cloneVisibleEntry(
  entry: NavigationEntry,
  permissions: string[],
  role?: string,
): NavigationEntry | undefined {
  const children = entry.children
    ?.map((child) => cloneVisibleEntry(child, permissions, role))
    .filter((child): child is NavigationEntry => Boolean(child));
  if (children?.length) return { ...entry, children };
  if (!entry.path || !canAccess(permissions, entry.permission, role)) return undefined;
  return { ...entry };
}

function selectedNavigationGroups(menu?: AuthMenuItem[]): NavigationGroup[] {
  return menu?.length ? runtimeNavigationGroups(menu) : navigationGroups;
}

function flattenEntries(entries: NavigationEntry[]): NavigationEntry[] {
  return entries.flatMap((entry) =>
    entry.children?.length ? flattenEntries(entry.children) : [{ ...entry }],
  );
}

export function visibleNavigation(
  permissions: string[] = [],
  role?: string,
  menu?: AuthMenuItem[],
): NavigationEntry[] {
  return flattenEntries(
    visibleNavigationGroups(permissions, role, menu)
      .flatMap((group) => group.entries),
  );
}

export function visibleNavigationGroups(
  permissions: string[] = [],
  role?: string,
  menu?: AuthMenuItem[],
): NavigationGroup[] {
  return selectedNavigationGroups(menu)
    .map((group) => ({
      ...group,
      entries: group.entries
        .map((entry) => cloneVisibleEntry(entry, permissions, role))
        .filter((entry): entry is NavigationEntry => Boolean(entry)),
    }))
    .filter((group) => group.entries.length > 0);
}

function pathMatches(currentPath: string, entryPath?: string): boolean {
  if (!entryPath) return false;
  return currentPath === entryPath ||
    (entryPath !== "/" && currentPath.startsWith(`${entryPath}/`));
}

export function entryContainsPath(entry: NavigationEntry, currentPath: string): boolean {
  return pathMatches(currentPath, entry.path) ||
    Boolean(entry.children?.some((child) => entryContainsPath(child, currentPath)));
}

export function requiresNavigationAccess(path: string): boolean {
  return navigationGroups.some((group) =>
    group.entries.some((entry) => entryContainsPath(entry, path)),
  );
}

export function navigationAllowsPath(
  path: string,
  permissions: string[] = [],
  role?: string,
  menu?: AuthMenuItem[],
): boolean {
  if (!menu?.length) return true;
  return visibleNavigationGroups(permissions, role, menu).some((group) =>
    group.entries.some((entry) => entryContainsPath(entry, path)),
  );
}

export function internalRedirectTarget(value: unknown): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string") return undefined;
  const normalized = candidate.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return undefined;

  const parsed = new URL(normalized, window.location.origin);
  if (parsed.origin !== window.location.origin) return undefined;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
