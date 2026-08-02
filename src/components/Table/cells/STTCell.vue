<template><span>{{ ((page || 1) - 1) * (limit || 1) + (rowIndex || 0) + 1 }}</span></template>

<script setup lang="ts">
import type { TableCellContext } from "@/components/Table/cells/contracts";

defineProps<TableCellContext>();
</script>
