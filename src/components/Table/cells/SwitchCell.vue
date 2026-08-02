<template>
  <div class="form-check form-switch mb-0">
    <input
      :id="`table-${column.key}-${row.id}`"
      class="form-check-input"
      type="checkbox"
      :checked="Boolean(cellValue(row, column))"
      disabled
    />
  </div>
</template>

<script setup lang="ts">
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { cellValue } from "@/components/Table/cells/value";

defineProps<TableCellContext>();
</script>
