import type { ColumnDefinition, ResourceRow } from "@/config/resource";
import { formatResourceValue } from "@/utils/resource-display";

type ValueRecord = Record<string, unknown>;

export function valueAtPath(row: ValueRecord, path: string | undefined): unknown {
  if (!path) return undefined;

  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return (value as ValueRecord)[segment];
  }, row);
}

export function cellValue(row: ResourceRow, column: ColumnDefinition): unknown {
  return valueAtPath(row, column.key);
}

export function cellText(row: ResourceRow, column: ColumnDefinition): string {
  return formatResourceValue(cellValue(row, column), column);
}

export function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function asNumberSeries(value: unknown): number[] {
  return asArray(value)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}
