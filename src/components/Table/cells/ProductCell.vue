<template>
  <div class="product-cell d-flex align-items-center gap-3">
    <RouterLink
      v-if="detailUrl"
      :to="detailUrl"
      class="product-cell__media d-grid overflow-hidden border border-translucent rounded-2 bg-body-secondary flex-shrink-0 text-decoration-none"
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
    </RouterLink>
    <span
      v-else
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
      <RouterLink
        v-if="detailUrl"
        :to="detailUrl"
        class="product-cell__name fw-semibold text-body-emphasis text-decoration-none mb-1 d-block"
      >
        {{ name || "—" }}
      </RouterLink>
      <div v-else class="product-cell__name fw-semibold text-body-emphasis mb-1">
        {{ name || "—" }}
      </div>
      <RouterLink
        v-if="detailUrl"
        :to="detailUrl"
        class="product-cell__code fs-10 text-body-tertiary text-decoration-none"
      >
        {{ subtitle }}
      </RouterLink>
      <div v-else class="product-cell__code fs-10 text-body-tertiary">
        {{ subtitle }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
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
const detailUrl = computed(() => {
  if (props.column.display?.url) {
    return props.column.display.url.replace(
      /[:{]([a-zA-Z0-9_]+)}?/g,
      (_, key) => String(props.row[key] ?? ""),
    );
  }
  if (!props.row.id) return "";
  if (Object.hasOwn(props.row, "skuCode")) {
    return `/products/${props.row.id}`;
  }
  return `/warehoused-goods/${props.row.id}`;
});
</script>

<style scoped>
.product-cell {
  min-width: 17rem;
}

.product-cell__media {
  width: 53px;
  height: 53px;
  transition: opacity 150ms ease, transform 150ms ease;
}

a.product-cell__media:hover {
  opacity: 0.85;
  transform: scale(1.02);
}

.product-cell__name {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  transition: color 150ms ease;
}

.product-cell__name:hover {
  color: var(--phoenix-primary) !important;
  text-decoration: underline !important;
}

.product-cell__code {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 150ms ease;
}

.product-cell__code:hover {
  color: var(--phoenix-primary) !important;
  text-decoration: underline !important;
}
</style>

