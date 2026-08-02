<template>
  <div v-if="visibleAlerts.length" class="row g-3 mb-4" aria-label="Cảnh báo cần xử lý">
    <div v-for="alert in visibleAlerts" :key="alert.key" class="col-12 col-md-6">
      <component
        :is="canOpen(alert) ? 'RouterLink' : 'div'"
        v-bind="canOpen(alert) ? { to: alert.path } : { 'aria-disabled': 'true' }"
        class="card h-100 text-decoration-none"
      >
        <span class="card-body d-flex align-items-center justify-content-between gap-3">
          <span class="avatar avatar-xl bg-success-subtle text-success">
            <AppIcon :name="iconFor(alert)" />
          </span>
          <span>
            <span class="fw-semibold text-body d-block">{{ alert.title }}</span>
            <small class="text-body-tertiary">{{ canOpen(alert) ? "Mở danh sách để xử lý" : "Không có quyền mở danh sách" }}</small>
          </span>
          <span class="badge badge-phoenix badge-phoenix-warning fs-8">{{ alert.value }}</span>
        </span>
      </component>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";

export interface DashboardAlert {
  key: string;
  title: string;
  value: number;
  path: string;
}

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
