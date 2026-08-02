import type { FormFieldDefinition } from "@/config/resource";

export function scalarInputValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function optionValue(field: FormFieldDefinition, rawValue: string): string | number {
  return field.options?.find((option) => String(option.value) === rawValue)?.value ?? rawValue;
}

export function numericInputValue(rawValue: string): number | null {
  if (rawValue.trim() === "") return null;
  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}
