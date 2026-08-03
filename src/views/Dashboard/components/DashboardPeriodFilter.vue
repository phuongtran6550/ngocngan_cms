<template>
  <section class="card dashboard-period-filter mb-4" aria-label="Bộ lọc kỳ báo cáo">
    <div class="card-body p-3 p-lg-4">
      <div class="d-flex flex-column flex-xl-row align-items-xl-center gap-3">
        <div class="min-w-0 me-xl-auto">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="dashboard-period-filter__pulse" aria-hidden="true" />
            <span class="fs-10 fw-bold text-uppercase text-body-tertiary">Kỳ đang xem</span>
          </div>
          <strong class="d-block fs-8">{{ periodLabel }}</strong>
          <small class="text-body-tertiary">
            {{ lastUpdatedLabel ? `Cập nhật ${lastUpdatedLabel}` : "Chưa có lần cập nhật thành công" }}
          </small>
        </div>

        <div class="dashboard-period-filter__presets" role="group" aria-label="Chọn nhanh kỳ báo cáo">
          <button
            v-for="option in presetOptions"
            :key="option.value"
            type="button"
            class="btn btn-sm text-nowrap"
            :class="selectedPreset === option.value ? 'btn-primary' : 'btn-phoenix-secondary'"
            :aria-pressed="selectedPreset === option.value"
            @click="selectPreset(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <form
        v-if="selectedPreset === 'custom'"
        class="dashboard-period-filter__custom mt-3 pt-3 border-top border-translucent"
        @submit.prevent="applyCustomRange"
      >
        <div>
          <label class="form-label fs-10 fw-bold mb-1" for="dashboard-period-from">Từ ngày</label>
          <input id="dashboard-period-from" v-model="draftFrom" type="date" class="form-control form-control-sm" />
        </div>
        <div>
          <label class="form-label fs-10 fw-bold mb-1" for="dashboard-period-to">Đến ngày</label>
          <input id="dashboard-period-to" v-model="draftTo" type="date" class="form-control form-control-sm" />
        </div>
        <button type="submit" class="btn btn-sm btn-primary align-self-end">Áp dụng khoảng ngày</button>
        <p v-if="validationError" class="text-danger fs-10 mb-0 align-self-end" role="alert">
          {{ validationError }}
        </p>
      </form>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import {
  dashboardCustomRangeError,
  dashboardPresetOptions,
} from "@/views/Dashboard/period";
import type {
  DashboardPreset,
  DashboardQuery,
} from "@/views/Dashboard/types";

export default defineComponent({
  name: "DashboardPeriodFilter",
  emits: {
    change: (_query: DashboardQuery) => true,
  },
  props: {
    query: { type: Object as PropType<DashboardQuery>, required: true },
    periodLabel: { type: String, default: "Kỳ báo cáo" },
    lastUpdatedLabel: { type: String, default: "" },
    suggestedFrom: { type: String, default: "" },
    suggestedTo: { type: String, default: "" },
  },
  data() {
    return {
      presetOptions: dashboardPresetOptions,
      selectedPreset: this.query.preset as DashboardPreset,
      draftFrom: this.query.from || "",
      draftTo: this.query.to || "",
      validationError: "",
    };
  },
  watch: {
    query: {
      deep: true,
      handler(query: DashboardQuery): void {
        this.selectedPreset = query.preset;
        if (query.preset === "custom") {
          this.draftFrom = query.from || "";
          this.draftTo = query.to || "";
        }
        this.validationError = "";
      },
    },
  },
  methods: {
    selectPreset(preset: DashboardPreset): void {
      this.selectedPreset = preset;
      this.validationError = "";
      if (preset === "custom") {
        this.draftFrom ||= this.suggestedFrom;
        this.draftTo ||= this.suggestedTo;
        return;
      }
      this.$emit("change", { preset });
    },
    applyCustomRange(): void {
      this.validationError = dashboardCustomRangeError(this.draftFrom, this.draftTo);
      if (this.validationError) return;
      this.$emit("change", {
        preset: "custom",
        from: this.draftFrom,
        to: this.draftTo,
      });
    },
  },
});
</script>

<style scoped>
.dashboard-period-filter {
  overflow: hidden;
  border-color: color-mix(in srgb, var(--phoenix-primary) 18%, var(--phoenix-border-color));
  background:
    linear-gradient(112deg, color-mix(in srgb, var(--phoenix-primary) 7%, transparent), transparent 44%),
    var(--phoenix-body-emphasis-bg);
}

.dashboard-period-filter__pulse {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--phoenix-success);
  box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--phoenix-success) 16%, transparent);
}

.dashboard-period-filter__presets {
  display: flex;
  gap: 0.45rem;
  max-width: 100%;
  overflow-x: auto;
  padding: 0.15rem 0 0.35rem;
  scrollbar-width: thin;
}

.dashboard-period-filter__custom {
  display: grid;
  grid-template-columns: repeat(2, minmax(9rem, 1fr)) auto;
  align-items: end;
  gap: 0.75rem;
}

@media (max-width: 767.98px) {
  .dashboard-period-filter__custom {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-period-filter__custom .btn,
  .dashboard-period-filter__custom p {
    grid-column: 1 / -1;
  }
}
</style>
