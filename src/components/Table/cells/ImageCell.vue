<template>
  <span v-if="source" class="d-inline-flex overflow-hidden border border-translucent rounded-2 bg-body-secondary">
    <img class="object-fit-cover" width="53" height="53" :src="source" :alt="`Ảnh ${row.name || row.id}`" />
  </span>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { assetUrl } from "@/request";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { cellValue } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const source = computed(() => {
  const value = cellValue(props.row, props.column);
  return value ? assetUrl(String(value)) : "";
});
</script>
