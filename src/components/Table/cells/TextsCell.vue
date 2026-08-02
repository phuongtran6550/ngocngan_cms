<template><span>{{ text || "—" }}</span></template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { asArray, cellValue, valueAtPath } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const text = computed(() => {
  const name = props.column.display?.name || "name";
  const separator = props.column.display?.join ?? ", ";
  return asArray(cellValue(props.row, props.column))
    .map((item) => item && typeof item === "object"
      ? valueAtPath(item as Record<string, unknown>, name)
      : item)
    .filter((item) => item != null && item !== "")
    .map(String)
    .join(separator);
});
</script>
