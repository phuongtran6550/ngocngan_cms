<template><span class="text-body-tertiary">{{ cellText(row, column) }}</span></template>

<script setup lang="ts">
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { cellText } from "@/components/Table/cells/value";

defineProps<TableCellContext>();
</script>
