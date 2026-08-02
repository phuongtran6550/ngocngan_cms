<template>
  <div class="d-flex align-items-center gap-2">
    <span>{{ text }}</span>
    <button type="button" class="btn btn-link btn-sm p-0 text-body-tertiary" :aria-label="`Sao chép ${text}`" @click="$emit('action', { type: 'copy', value: rawValue })">
      <AppIcon name="copy" />
    </button>
  </div>
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
