<template><span :class="isBold ? 'fw-semibold' : ''">{{ cellText(row, column) }}</span></template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { cellText, valueAtPath } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const isBold = computed(() => Boolean(
  props.column.display?.isBold && valueAtPath(props.row, props.column.display.isBold),
));
</script>
