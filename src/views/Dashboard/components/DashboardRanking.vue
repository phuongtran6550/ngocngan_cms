<template>
  <article class="card h-100">
    <div class="card-header bg-transparent border-bottom">
      <h2 class="fs-7 mb-1">{{ title }}</h2>
      <p v-if="description" class="text-body-tertiary fs-10 mb-0">{{ description }}</p>
    </div>
    <div class="card-body p-0">
      <div v-if="!items.length" class="p-4 text-body-tertiary">{{ emptyMessage }}</div>
      <component
        :is="item.to ? 'RouterLink' : 'div'"
        v-for="(item, index) in items"
        :key="item.id || String(index)"
        v-bind="item.to ? { to: item.to } : {}"
        class="dashboard-ranking-row d-flex align-items-center gap-3 px-3 px-lg-4 py-3 border-bottom border-translucent text-decoration-none"
        :class="{ 'dashboard-ranking-row--linked': item.to }"
      >
        <img v-if="item.thumbnail" class="dashboard-ranking-row__image" :src="imageUrl(item.thumbnail)" alt="" />
        <span v-else class="dashboard-ranking-row__index">{{ index + 1 }}</span>
        <span class="min-w-0 flex-grow-1">
          <strong class="d-block text-body text-truncate">{{ item.title || "Chưa đặt tên" }}</strong>
          <small class="text-body-tertiary d-block text-truncate">{{ item.subtitle || item.meta || "—" }}</small>
          <small v-if="item.subtitle && item.meta" class="text-body-tertiary d-block text-truncate">{{ item.meta }}</small>
        </span>
        <strong class="text-body text-end text-nowrap">{{ display(item.value) }}</strong>
      </component>
    </div>
  </article>
</template>
<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { assetUrl } from "@/request";
import { formatMoney, formatNumberValue } from "@/utils/resource-display";

export interface DashboardRankingItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  value: number;
  thumbnail?: string;
  to?: RouteLocationRaw;
}

export default defineComponent({
  name: "DashboardRanking",
  props: {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    items: { type: Array as PropType<DashboardRankingItem[]>, default: () => [] },
    emptyMessage: { type: String, default: "Chưa có dữ liệu trong kỳ." },
    valueFormat: { type: String as PropType<"money" | "number">, default: "number" },
  },
  methods: {
    display(value: unknown): string { return this.valueFormat === "money" ? formatMoney(value) : formatNumberValue(value); },
    imageUrl(value: string): string { return assetUrl(value); },
  },
});
</script>

<style scoped>
.dashboard-ranking-row:last-child { border-bottom: 0 !important; }
.dashboard-ranking-row--linked { transition: background-color 160ms ease, padding-left 160ms ease; }
.dashboard-ranking-row--linked:hover,
.dashboard-ranking-row--linked:focus-visible { background: var(--phoenix-body-highlight-bg); padding-left: 1.65rem !important; }
.dashboard-ranking-row__index,
.dashboard-ranking-row__image {
  flex: 0 0 auto;
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 0.8rem;
}
.dashboard-ranking-row__index {
  display: grid;
  place-items: center;
  color: var(--phoenix-primary);
  background: var(--phoenix-primary-bg-subtle);
  font-weight: 800;
}
.dashboard-ranking-row__image { object-fit: cover; background: var(--phoenix-body-highlight-bg); }
</style>
