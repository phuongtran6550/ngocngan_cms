<template>
  <div v-if="tags.length" class="d-flex flex-wrap gap-1">
    <span v-for="tag in tags" :key="tag" class="badge badge-tag">{{ tag }}</span>
  </div>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { asArray, cellValue } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const tags = computed(() => asArray(cellValue(props.row, props.column)).map(String));
</script>
