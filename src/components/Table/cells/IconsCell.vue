<template>
  <div v-if="tools.length" class="d-flex flex-nowrap gap-1">
    <span
      v-for="tool in tools"
      :key="tool.id"
      class="badge d-flex align-items-center justify-content-center p-2 rounded"
      :class="toneClass(tool.status)"
      :title="tool.name"
      style="width: 34px; height: 34px"
    >
      <i :class="tool.icon" aria-hidden="true" />
    </span>
  </div>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { asArray, cellValue } from "@/components/Table/cells/value";

interface IconItem {
  id: string;
  icon: string;
  name: string;
  status: string;
}

const props = defineProps<TableCellContext>();
const tools = computed<IconItem[]>(() => asArray(cellValue(props.row, props.column))
  .map((value, index) => {
    if (typeof value === "string") {
      return { id: `${value}-${index}`, icon: value, name: value, status: "" };
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const item = value as Record<string, unknown>;
    const icon = String(item.icon || "");
    return icon
      ? {
        id: String(item.id || `${icon}-${index}`),
        icon,
        name: String(item.name || icon),
        status: String(item.status || ""),
      }
      : null;
  })
  .filter((item): item is IconItem => item !== null));

function toneClass(status: string): string {
  if (status === "success") return "bg-success bg-opacity-15 text-success";
  if (status === "error") return "bg-danger bg-opacity-15 text-danger";
  return "bg-dark bg-opacity-10 text-body-tertiary";
}
</script>
