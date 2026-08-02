<template>
  <article class="card h-100">
    <div class="card-body">
      <p class="text-body-tertiary fs-10 fw-bold text-uppercase mb-2">{{ label }}</p>
      <strong class="d-block fs-5 mb-2" :class="valueClass">{{ displayValue }}</strong>
      <span class="badge badge-phoenix" :class="changeClass">{{ changeLabel }}</span>
      <span class="text-body-tertiary fs-10 ms-2">so với kỳ trước</span>
    </div>
  </article>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { DashboardMetric } from "@/views/Dashboard/types";
import { formatMoney, formatNumberValue } from "@/utils/resource-display";

export default defineComponent({
  name: "KpiCard",
  props: {
    label: { type: String, required: true },
    metric: { type: Object as PropType<DashboardMetric>, required: true },
    format: { type: String as PropType<"money" | "number">, default: "money" },
    tone: { type: String as PropType<"blue" | "green" | "amber" | "red">, default: "blue" },
  },
  computed: {
    displayValue(): string { return this.format === "money" ? formatMoney(this.metric.value) : formatNumberValue(this.metric.value); },
    changeLabel(): string { return `${this.metric.changePercent >= 0 ? "+" : ""}${this.metric.changePercent}%`; },
    changeClass(): string { return this.metric.changePercent >= 0 ? "badge-phoenix-success" : "badge-phoenix-danger"; },
    valueClass(): string {
      return {
        blue: "text-primary",
        green: "text-success",
        amber: "text-warning",
        red: "text-danger",
      }[this.tone];
    },
  },
});
</script>
