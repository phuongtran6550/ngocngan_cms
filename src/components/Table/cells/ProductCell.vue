<template>
  <div class="product-cell d-flex align-items-center gap-3">
    <span
      class="product-cell__media d-grid overflow-hidden border border-translucent rounded-2 bg-body-secondary flex-shrink-0"
    >
      <img
        v-if="source"
        :src="source"
        :alt="`Ảnh ${name || row.code || row.id}`"
        width="53"
        height="53"
        class="object-fit-cover"
      />
      <span
        v-else
        class="place-self-center text-body-tertiary"
        aria-hidden="true"
      >
        —
      </span>
    </span>
    <div class="min-w-0">
      <div v-if="pricingType" class="mb-1">
        <span class="badge badge-phoenix badge-phoenix-primary">{{ pricingType }}</span>
      </div>
      <div class="product-cell__name fw-semibold text-body-emphasis mb-1">
        {{ name || "—" }}
      </div>
      <div class="product-cell__code fs-10 text-body-tertiary">
        {{ subtitle }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { assetUrl } from "@/request";
import type { TableCellContext } from "@/components/Table/cells/contracts";

const props = defineProps<TableCellContext>();
const name = computed(() => String(props.row.name || ""));
const pricingType = computed(() => String(props.row.pricingType || ""));
const subtitle = computed(() => {
  const skuCode = String(props.row.skuCode || "").trim();
  if (Object.hasOwn(props.row, "skuCode")) return `SKU: ${skuCode || "—"}`;
  const skus = props.row.skus;
  const skuCount = Array.isArray(skus) ? skus.length : 0;
  return `${skuCount} phiên bản (SKU)`;
});
const source = computed(() =>
  props.row.thumbnail ? assetUrl(String(props.row.thumbnail)) : "",
);
</script>

<style scoped>
.product-cell {
  min-width: 17rem;
}

.product-cell__media {
  width: 53px;
  height: 53px;
}

.product-cell__name {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-cell__code {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
