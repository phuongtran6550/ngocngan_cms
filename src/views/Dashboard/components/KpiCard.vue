<template>
  <component
    :is="to ? 'RouterLink' : 'article'"
    v-bind="to ? { to } : {}"
    class="card kpi-card h-100 text-decoration-none"
    :class="[`kpi-card--${variant}`, { 'kpi-card--linked': to }]"
  >
    <div class="card-body d-flex flex-column">
      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <p class="text-body-tertiary fs-10 fw-bold text-uppercase mb-0">{{ label }}</p>
        <span class="kpi-card__icon" :class="`kpi-card__icon--${tone}`" aria-hidden="true">
          <AppIcon :name="icon" />
        </span>
      </div>
      <strong class="d-block fs-5 mb-3" :class="valueClass">{{ displayValue }}</strong>
      <div class="d-flex flex-wrap align-items-center gap-2 mt-auto">
        <span v-if="snapshot" class="badge badge-phoenix badge-phoenix-info">Hiện tại</span>
        <span v-else class="badge badge-phoenix" :class="changeClass">{{ changeLabel }}</span>
        <span class="text-body-tertiary fs-10">{{ comparisonText }}</span>
      </div>
    </div>
  </component>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { RouteLocationRaw } from "vue-router";
import AppIcon from "@/components/ui/AppIcon.vue";
import type { DashboardMetric } from "@/views/Dashboard/types";
import { formatMoney, formatNumberValue } from "@/utils/resource-display";

export default defineComponent({
  name: "KpiCard",
  components: { AppIcon },
  props: {
    label: { type: String, required: true },
    metric: { type: Object as PropType<DashboardMetric>, required: true },
    format: { type: String as PropType<"money" | "number" | "percent">, default: "money" },
    tone: { type: String as PropType<"blue" | "green" | "amber" | "red">, default: "blue" },
    icon: { type: String, default: "pie-chart" },
    to: { type: [String, Object] as PropType<RouteLocationRaw>, default: undefined },
    snapshot: { type: Boolean, default: false },
    variant: { type: String as PropType<"primary" | "secondary">, default: "secondary" },
    changeDirection: {
      type: String as PropType<"higher" | "lower" | "neutral">,
      default: "higher",
    },
  },
  computed: {
    displayValue(): string { return this.formatValue(this.metric.value); },
    previousValue(): string { return this.formatValue(this.metric.previousValue); },
    changeLabel(): string {
      if (!this.metric.changePercent) return "Không đổi";
      return `${this.metric.changePercent > 0 ? "Tăng" : "Giảm"} ${Math.abs(this.metric.changePercent)}%`;
    },
    changeClass(): string {
      if (!this.metric.changePercent || this.changeDirection === "neutral") return "badge-phoenix-secondary";
      const positive = this.metric.changePercent > 0;
      const favorable = this.changeDirection === "higher" ? positive : !positive;
      return favorable ? "badge-phoenix-success" : "badge-phoenix-danger";
    },
    comparisonText(): string {
      return this.snapshot ? "Ảnh chụp tồn kho hiện tại" : `Kỳ trước: ${this.previousValue}`;
    },
    valueClass(): string {
      return {
        blue: "text-primary",
        green: "text-success",
        amber: "text-warning",
        red: "text-danger",
      }[this.tone];
    },
  },
  methods: {
    formatValue(value: number): string {
      if (this.format === "money") return formatMoney(value);
      const formatted = formatNumberValue(value);
      return this.format === "percent" ? `${formatted}%` : formatted;
    },
  },
});
</script>

<style scoped>
.kpi-card {
  border-color: color-mix(in srgb, var(--phoenix-border-color) 78%, transparent);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.kpi-card--primary {
  border-color: rgba(255, 255, 255, 0.18);
  background: color-mix(in srgb, var(--phoenix-body-emphasis-bg) 94%, rgba(255, 255, 255, 0.86));
  backdrop-filter: blur(0.5rem);
}

.kpi-card--linked:hover,
.kpi-card--linked:focus-visible {
  transform: translateY(-0.2rem);
  border-color: color-mix(in srgb, var(--phoenix-primary) 35%, var(--phoenix-border-color));
  box-shadow: 0 0.75rem 1.75rem rgba(23, 48, 73, 0.12);
}

.kpi-card__icon {
  display: grid;
  flex: 0 0 auto;
  width: 2.35rem;
  height: 2.35rem;
  place-items: center;
  border-radius: 0.8rem;
}

.kpi-card__icon--blue { color: var(--phoenix-primary); background: var(--phoenix-primary-bg-subtle); }
.kpi-card__icon--green { color: var(--phoenix-success); background: var(--phoenix-success-bg-subtle); }
.kpi-card__icon--amber { color: var(--phoenix-warning-text-emphasis); background: var(--phoenix-warning-bg-subtle); }
.kpi-card__icon--red { color: var(--phoenix-danger); background: var(--phoenix-danger-bg-subtle); }
</style>
