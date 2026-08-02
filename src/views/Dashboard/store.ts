import { defineStore } from "pinia";
import { dashboardService } from "@/views/Dashboard/service";
import type { DashboardOverview } from "@/views/Dashboard/types";
import { apiError } from "@/request";

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    data: null as DashboardOverview | null,
    loading: false,
    error: "",
    controller: null as AbortController | null,
    requestId: 0,
  }),
  actions: {
    async load(): Promise<void> {
      this.controller?.abort();
      this.controller = new AbortController();
      const requestId = ++this.requestId;
      this.loading = true;
      this.error = "";
      try {
        const result = await dashboardService.overview(this.controller.signal);
        if (requestId === this.requestId) this.data = result;
      } catch (error) {
        if (requestId !== this.requestId) return;
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED") this.error = normalized.message;
      } finally {
        if (requestId === this.requestId) this.loading = false;
      }
    },
  },
});
