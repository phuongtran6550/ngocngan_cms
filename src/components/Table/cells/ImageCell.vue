<template>
  <RouterLink
    v-if="source && linkUrl"
    :to="linkUrl"
    class="d-inline-flex overflow-hidden border border-translucent rounded-2 bg-body-secondary image-cell__link"
  >
    <img class="object-fit-cover" width="53" height="53" :src="source" :alt="`Ảnh ${row.name || row.id}`" />
  </RouterLink>
  <span v-else-if="source" class="d-inline-flex overflow-hidden border border-translucent rounded-2 bg-body-secondary">
    <img class="object-fit-cover" width="53" height="53" :src="source" :alt="`Ảnh ${row.name || row.id}`" />
  </span>
  <span v-else>—</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { assetUrl } from "@/request";
import type { TableCellContext } from "@/components/Table/cells/contracts";
import { cellValue } from "@/components/Table/cells/value";

const props = defineProps<TableCellContext>();
const source = computed(() => {
  const value = cellValue(props.row, props.column);
  return value ? assetUrl(String(value)) : "";
});
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
.image-cell__link {
  transition: opacity 150ms ease, transform 150ms ease;
}
.image-cell__link:hover {
  opacity: 0.85;
  transform: scale(1.02);
}
</style>

