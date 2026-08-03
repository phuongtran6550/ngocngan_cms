import { calendarDateValue } from "@/utils/date-range";

export function routeQueryText(value: unknown): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === "string" ? candidate.trim() : "";
}

export function routeQueryDate(value: unknown): string {
  return calendarDateValue(routeQueryText(value));
}

export function routeQueryEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | "" {
  const candidate = routeQueryText(value);
  return allowed.includes(candidate as T) ? (candidate as T) : "";
}
