<template>
  <article class="card h-100">
    <div class="card-header bg-transparent border-bottom"><h2 class="fs-7 mb-0">{{ title }}</h2></div>
    <div class="card-body p-0">
      <div v-if="!items.length" class="p-4 text-body-tertiary">Chưa có dữ liệu.</div>
      <div v-for="(item, index) in items" :key="String(item.id || index)" class="d-flex align-items-center justify-content-between gap-3 px-4 py-3 border-bottom border-translucent">
        <span><strong class="d-block">{{ item.name || item.code || 'Chưa đặt tên' }}</strong><small class="text-body-tertiary">{{ item.phone || `${metaLabel}: ${item[metaKey] || 0}` }}</small></span>
        <strong>{{ display(item[valueKey]) }}</strong>
      </div>
    </div>
  </article>
</template>
<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { formatMoney, formatNumberValue } from "@/utils/resource-display";
export default defineComponent({
  name: "DashboardRanking",
  props: {
    title: { type: String, required: true },
    items: { type: Array as PropType<Array<Record<string, unknown>>>, default: () => [] },
    valueKey: { type: String, required: true },
    metaKey: { type: String, required: true },
    metaLabel: { type: String, default: "Số lượng" },
    valueFormat: { type: String as PropType<"money" | "number">, default: "number" },
  },
  methods: { display(value: unknown): string { return this.valueFormat === "money" ? formatMoney(value) : formatNumberValue(value); } },
});
</script>
