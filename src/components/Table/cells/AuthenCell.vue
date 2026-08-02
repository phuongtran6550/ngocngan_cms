<template>
  <span class="d-inline-flex align-items-center gap-1 text-nowrap" :class="authorized ? 'text-success' : 'text-body-tertiary'">
    <span class="rounded-circle" :class="authorized ? 'bg-success' : 'bg-body-secondary'" style="width: 0.45rem; height: 0.45rem" />
    {{ authorized ? "Đã cấp quyền" : "Chưa cấp quyền" }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { cellValue } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const authorized = computed(() => Boolean(cellValue(props.row, props.column)));
</script>
