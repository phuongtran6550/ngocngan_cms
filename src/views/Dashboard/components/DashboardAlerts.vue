<template>
  <section v-if="visibleAlerts.length" class="mb-4" aria-labelledby="dashboard-alerts-title">
    <div class="d-flex align-items-end justify-content-between gap-3 mb-2">
      <div>
        <p class="fs-10 fw-bold text-uppercase text-danger mb-1">Cần chú ý</p>
        <h2 id="dashboard-alerts-title" class="fs-7 mb-0">Việc cần xử lý ngay</h2>
      </div>
      <span class="text-body-tertiary fs-10">{{ visibleAlerts.length }} nhóm cảnh báo</span>
    </div>
    <div class="row g-3">
      <div v-for="alert in visibleAlerts" :key="alert.key" class="col-12 col-md-6">
        <component
          :is="canOpen(alert) ? 'RouterLink' : 'div'"
          v-bind="canOpen(alert) ? { to: alert.path } : { 'aria-disabled': 'true' }"
          class="card dashboard-alert h-100 text-decoration-none"
          :class="{ 'dashboard-alert--linked': canOpen(alert) }"
        >
          <span class="card-body d-flex align-items-center justify-content-between gap-3">
            <span class="dashboard-alert__icon">
              <AppIcon :name="iconFor(alert)" />
            </span>
            <span class="flex-grow-1 min-w-0">
              <span class="fw-semibold text-body d-block">{{ alert.title }}</span>
              <small class="text-body-tertiary">{{ canOpen(alert) ? "Mở danh sách đã lọc để xử lý" : "Không có quyền mở danh sách" }}</small>
            </span>
            <span class="badge badge-phoenix badge-phoenix-warning fs-8">{{ alert.value }}</span>
          </span>
        </component>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import type { DashboardAlert } from "@/views/Dashboard/types";

export default defineComponent({
  name: "DashboardAlerts",
  components: { AppIcon },
  props: {
    alerts: {
      type: Array as PropType<DashboardAlert[]>,
      default: () => [],
    },
    canOpen: {
      type: Function as PropType<(alert: DashboardAlert) => boolean>,
      default: () => true,
    },
  },
  computed: {
    visibleAlerts(): DashboardAlert[] {
      return this.alerts.filter((alert) => Number(alert.value) > 0);
    },
  },
  methods: {
    iconFor(alert: DashboardAlert): string {
      return alert.path.includes("warehouse") ? "archive" : "shopping-cart";
    },
  },
});
</script>

<style scoped>
.dashboard-alert {
  overflow: hidden;
  border-color: color-mix(in srgb, var(--phoenix-warning) 28%, var(--phoenix-border-color));
  background: linear-gradient(120deg, var(--phoenix-warning-bg-subtle), var(--phoenix-body-emphasis-bg) 58%);
}

.dashboard-alert::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0.25rem;
  background: var(--phoenix-warning);
  content: "";
}

.dashboard-alert--linked { transition: transform 160ms ease, box-shadow 160ms ease; }
.dashboard-alert--linked:hover,
.dashboard-alert--linked:focus-visible { transform: translateY(-0.15rem); box-shadow: 0 0.75rem 1.5rem rgba(84, 67, 20, 0.1); }
.dashboard-alert__icon {
  display: grid;
  flex: 0 0 auto;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: 0.85rem;
  color: var(--phoenix-warning-text-emphasis);
  background: color-mix(in srgb, var(--phoenix-warning) 18%, transparent);
}
</style>
