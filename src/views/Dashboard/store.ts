import { defineStore } from "pinia";
import { dashboardService } from "@/views/Dashboard/service";
import { defaultDashboardQuery } from "@/views/Dashboard/period";
import type {
  DashboardOverview,
  DashboardQuery,
} from "@/views/Dashboard/types";
import { apiError } from "@/request";

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    data: null as DashboardOverview | null,
    query: { ...defaultDashboardQuery } as DashboardQuery,
    loading: false,
    error: "",
    lastUpdatedAt: "",
    controller: null as AbortController | null,
    requestId: 0,
  }),
  actions: {
    async load(query: DashboardQuery = this.query): Promise<void> {
      this.controller?.abort();
      this.controller = new AbortController();
      const requestId = ++this.requestId;
      this.query = { ...query };
      this.loading = true;
      this.error = "";
      try {
        const result = await dashboardService.overview(
          this.query,
          this.controller.signal,
        );
        if (requestId === this.requestId) {
          this.data = result;
          this.lastUpdatedAt = new Date().toISOString();
        }
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
