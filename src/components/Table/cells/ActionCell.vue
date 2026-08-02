<template>
  <div v-if="column.actions?.length" class="d-inline-flex align-items-center gap-1 text-nowrap">
    <button
      v-for="action in column.actions"
      :key="action.key"
      type="button"
      class="btn btn-link btn-sm p-0 text-body-tertiary"
      :disabled="action.disabled"
      :aria-label="action.label"
      :title="action.label"
      @click="$emit('action', { type: 'action', value: { key: action.key, row } })"
    >
      <AppIcon v-if="action.icon" :name="action.icon" />
      <span v-else>{{ action.label }}</span>
    </button>
  </div>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import AppIcon from "@/components/ui/AppIcon.vue";
import type { TableCellAction, TableCellContext } from "@/components/Table/cells/contracts";

defineProps<TableCellContext>();
defineEmits<{ action: [payload: TableCellAction] }>();
</script>
