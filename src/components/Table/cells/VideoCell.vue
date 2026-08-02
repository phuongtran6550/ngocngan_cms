<template>
  <div v-if="title || description || avatar" class="d-flex align-items-center gap-3">
    <img v-if="avatar" class="object-fit-cover rounded-2" width="80" height="60" :src="avatar" alt="" />
    <div class="min-w-0">
      <div v-if="badge || type" class="d-flex flex-wrap gap-1 mb-1">
        <span v-if="badge" class="badge badge-phoenix badge-phoenix-primary">{{ badge }}</span>
        <span v-if="type" class="badge badge-tag">{{ type }}</span>
      </div>
      <div class="fw-semibold text-truncate">{{ title || "—" }}</div>
      <div v-if="description" class="text-body-tertiary fs-10 text-truncate">{{ description }}</div>
    </div>
  </div>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { useProfileDisplay } from "@/components/Table/cells/profile-display";

const props = defineProps<TableCellContext>();
const { avatar, badge, description, title, type } = useProfileDisplay(
  computed(() => props.row),
  computed(() => props.column),
);
</script>
