import { computed, type ComputedRef } from "vue";
import type { ColumnDefinition, ResourceRow } from "@/config/resource";
import { assetUrl } from "@/request";
import { valueAtPath } from "@/components/Table/cells/value";

export interface ProfileDisplayValues {
  avatar: ComputedRef<string>;
  badge: ComputedRef<string>;
  description: ComputedRef<string>;
  title: ComputedRef<string>;
  type: ComputedRef<string>;
}

function displayValue(
  row: ResourceRow,
  configuredPath: string | undefined,
  fallbackPaths: string[],
): unknown {
  if (configuredPath) return valueAtPath(row, configuredPath);

  for (const path of fallbackPaths) {
    const value = valueAtPath(row, path);
    if (value != null && value !== "") return value;
  }

  return undefined;
}

function displayText(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return String(record.text || record.label || record.badge || "");
  }
  return value == null ? "" : String(value);
}

export function useProfileDisplay(
  row: ComputedRef<ResourceRow>,
  column: ComputedRef<ColumnDefinition>,
): ProfileDisplayValues {
  const avatar = computed(() => {
    if (column.value.display?.avatar === false) return "";
    const value = displayValue(
      row.value,
      column.value.display?.avatar,
      ["avatar", "thumbnail"],
    );
    return value ? assetUrl(String(value)) : "";
  });
  const title = computed(() => displayText(displayValue(
    row.value,
    column.value.display?.title,
    ["name", "title"],
  )));
  const description = computed(() => displayText(displayValue(
    row.value,
    column.value.display?.desc,
    ["description", "describe", "desc"],
  )));
  const badge = computed(() => displayText(displayValue(
    row.value,
    column.value.display?.badge,
    [],
  )));
  const type = computed(() => displayText(displayValue(
    row.value,
    column.value.display?.type,
    [],
  )));

  return { avatar, badge, description, title, type };
}
