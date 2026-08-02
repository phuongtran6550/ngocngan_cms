<template>
  <div v-if="title || description || showAvatar" class="d-flex align-items-center gap-2">
    <AppAvatar v-if="showAvatar" :src="avatar" />
    <div class="min-w-0">
      <div class="fw-semibold text-truncate">{{ title || "—" }}</div>
      <div v-if="badge" class="badge badge-phoenix badge-phoenix-primary mt-1">{{ badge }}</div>
      <div v-if="description" class="text-body-tertiary fs-10 text-truncate">{{ description }}</div>
    </div>
  </div>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { useProfileDisplay } from "@/components/Table/cells/profile-display";
import AppAvatar from "@/components/ui/AppAvatar.vue";

const props = defineProps<TableCellContext>();
const row = computed(() => props.row);
const column = computed(() => props.column);
const { avatar, badge, description, title } = useProfileDisplay(row, column);
const showAvatar = computed(() => (
  Boolean(avatar.value) || typeof column.value.display?.avatar === "string"
));
</script>
