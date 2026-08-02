<template>
  <component
    :is="renderer"
    :row="row"
    :column="column"
    :row-index="rowIndex"
    :page="page"
    :limit="limit"
    @action="$emit('action', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ColumnDefinition, ResourceRow } from "@/config/resource";
import { resolveTableCell } from "@/components/Table/cell-registry";

const props = withDefaults(defineProps<{
  row: ResourceRow;
  column: ColumnDefinition;
  rowIndex?: number;
  page?: number;
  limit?: number;
}>(), {
  rowIndex: 0,
  page: 1,
  limit: 20,
});

defineEmits<{ action: [payload: unknown] }>();
const renderer = computed(() => resolveTableCell(props.column.type));
</script>
