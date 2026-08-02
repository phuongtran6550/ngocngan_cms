import type { ResourceRow } from "@/config/resource";

export function resourceIdentity(row: ResourceRow): string {
  return String(row.name || row.code || row.id);
}

export function resourceActionLabel(action: string, row: ResourceRow): string {
  return `${action} ${resourceIdentity(row)}`;
}
