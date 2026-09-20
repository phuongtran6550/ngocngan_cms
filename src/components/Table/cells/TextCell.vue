<template>
  <RouterLink
    v-if="linkUrl"
    :to="linkUrl"
    class="fw-semibold text-primary text-decoration-none text-cell__link"
  >
    {{ text }}
  </RouterLink>
  <span v-else class="fw-semibold">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { cellText } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const text = computed(() => cellText(props.row, props.column));
const linkUrl = computed(() => {
  const url = props.column.display?.url;
  if (!url) return "";
  return url.replace(
    /[:{]([a-zA-Z0-9_]+)}?/g,
    (_, key) => String(props.row[key] ?? ""),
  );
});
</script>

<style scoped>
.text-cell__link:hover {
  text-decoration: underline !important;
}
</style>

