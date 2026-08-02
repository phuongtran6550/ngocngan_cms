<template><span>{{ duration }}</span></template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { cellValue } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const duration = computed(() => {
  const value = String(cellValue(props.row, props.column) || "");
  const match = value.match(/P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/);
  if (!match) return "—";

  const seconds = Number(match[1] || 0) * 86_400 + Number(match[2] || 0) * 3_600
    + Number(match[3] || 0) * 60 + Number(match[4] || 0);
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
});
</script>
