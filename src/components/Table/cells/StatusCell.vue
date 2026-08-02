<template>
  <span class="badge badge-phoenix" :class="resourceStatusClass(cellValue(row, column))">
    {{ resourceStatusLabel(cellValue(row, column)) }}
  </span>
</template>

<script setup lang="ts">
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { cellValue } from "@/components/Table/cells/value";
import { resourceStatusClass, resourceStatusLabel } from "@/utils/resource-display";

defineProps<TableCellContext>();
</script>
