<template>
  <table class="table table-borderless table-sm mb-0">
    <tbody>
      <tr v-for="item in items" :key="item.key">
        <th v-if="item.label" class="pe-3 fw-normal text-body-tertiary">{{ item.label }}:</th>
        <td :class="item.strong ? 'fw-semibold text-end' : 'text-end'">{{ valueAtPath(row, item.key) ?? "—" }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { valueAtPath } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const items = computed(() => props.column.groupItems || []);
</script>
