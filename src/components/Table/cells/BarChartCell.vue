<template>
  <div v-if="series.length" class="d-flex align-items-end gap-1" style="width: 96px; height: 40px">
    <span
      v-for="(value, index) in series"
      :key="index"
      class="flex-fill rounded-top bg-primary"
      :style="{ height: `${barHeight(value)}%`, minWidth: '2px' }"
      :title="String(value)"
    />
  </div>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { asNumberSeries, cellValue } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const series = computed(() => asNumberSeries(cellValue(props.row, props.column)));
const maximum = computed(() => Math.max(...series.value, 1));

function barHeight(value: number): number {
  return Math.max((value / maximum.value) * 100, 4);
}
</script>
