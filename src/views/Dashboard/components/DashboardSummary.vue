<template>
  <section class="dashboard-summary-shell mb-4" aria-labelledby="dashboard-summary-title">
    <div class="dashboard-summary-shell__heading">
      <div>
        <p class="fs-10 fw-bold text-uppercase text-white-50 mb-1">Nhịp vận hành</p>
        <h2 id="dashboard-summary-title" class="fs-6 text-white mb-1">Tóm tắt kỳ báo cáo</h2>
        <p class="fs-10 text-white-50 mb-0">{{ comparisonLabel }}</p>
      </div>
      <span class="dashboard-summary-shell__mark" aria-hidden="true">NC</span>
    </div>
    <div class="row g-3 position-relative dashboard-summary-shell__grid">
      <div v-for="item in items" :key="item.key" class="col-12 col-sm-6 col-xl-3">
        <KpiCard v-bind="item" variant="primary" />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { RouteLocationRaw } from "vue-router";
import KpiCard from "@/views/Dashboard/components/KpiCard.vue";
import type { DashboardMetric } from "@/views/Dashboard/types";

export interface DashboardSummaryItem {
  key: string;
  label: string;
  metric: DashboardMetric;
  format: "money" | "number" | "percent";
  tone: "blue" | "green" | "amber" | "red";
  icon: string;
  to?: RouteLocationRaw;
  changeDirection?: "higher" | "lower" | "neutral";
}

export default defineComponent({
  name: "DashboardSummary",
  components: { KpiCard },
  props: {
    items: {
      type: Array as PropType<DashboardSummaryItem[]>,
      default: () => [],
    },
    comparisonLabel: { type: String, default: "So sánh với kỳ liền trước" },
  },
});
</script>

<style scoped>
.dashboard-summary-shell {
  position: relative;
  overflow: hidden;
  padding: 1.25rem;
  border-radius: 1rem;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 180, 74, 0.42), transparent 28%),
    linear-gradient(135deg, #0b3a5b 0%, #0f5675 54%, #087f73 100%);
  box-shadow: 0 1rem 2.5rem rgba(16, 54, 78, 0.16);
}

.dashboard-summary-shell::after {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 2.4rem 2.4rem;
  content: "";
  pointer-events: none;
}

.dashboard-summary-shell__heading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dashboard-summary-shell__grid { z-index: 1; }

.dashboard-summary-shell__mark {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 800;
  letter-spacing: 0.08em;
}
</style>
