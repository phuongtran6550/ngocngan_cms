<template>
  <button type="button" class="btn btn-link p-0 text-start text-decoration-none" @click="$emit('action', { type: 'hyperlink', value: rawValue })">
    <span>{{ text }}</span>
    <AppIcon name="external-link" class="ms-1" />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import type { TableCellAction, TableCellContext } from "@/components/Table/cells/contracts";
import { cellText, cellValue } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
defineEmits<{ action: [payload: TableCellAction] }>();
const rawValue = computed(() => cellValue(props.row, props.column));
const text = computed(() => cellText(props.row, props.column));
</script>
