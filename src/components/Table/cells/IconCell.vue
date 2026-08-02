<template><i v-if="iconClass" :class="iconClass" aria-hidden="true" /><span v-else>—</span></template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { cellValue } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const iconClass = computed(() => String(cellValue(props.row, props.column) || ""));
</script>
