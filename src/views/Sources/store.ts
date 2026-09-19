import { defineStore } from "pinia";
import { apiError } from "@/request";
import { sourceService } from "@/views/Sources/service";
import type { SourceItem } from "@/views/Sources/types";

export const useSourceStore = defineStore("sources", {
  state: () => ({
    items: [] as SourceItem[],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    query: "",
    sortBy: "totalImportValue" as "name" | "itemCount" | "totalImportValue" | "latestImportAt",
    sortDirection: "desc" as "asc" | "desc",
    selectedColumns: ["name", "phone", "itemCount", "totalImportValue", "latestImportAt"],
    loading: false,
    error: "",
    controller: null as AbortController | null,
    requestId: 0,
  }),
  actions: {
    async load(page?: number): Promise<void> {
      page ??= this.pagination.page;
      this.controller?.abort(); this.controller = new AbortController();
      const requestId = ++this.requestId; this.loading = true; this.error = "";
      try {
        const result = await sourceService.list({ page, limit: this.pagination.limit, query: this.query || undefined, sortBy: this.sortBy, sortDirection: this.sortDirection }, this.controller.signal);
        if (requestId !== this.requestId) return;
        this.items = result.items; this.pagination = { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages };
      } catch (error) {
        if (requestId !== this.requestId) return;
        const normalized = apiError(error); if (normalized.code !== "ERR_CANCELED") this.error = normalized.message;
      } finally { if (requestId === this.requestId) this.loading = false; }
    },
    async applySearch(query: string): Promise<void> { this.query = query.trim(); await this.load(1); },
    async applySort(key: string): Promise<void> {
      if (!(["name", "itemCount", "totalImportValue", "latestImportAt"] as string[]).includes(key)) return;
      if (this.sortBy === key) this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      else { this.sortBy = key as typeof this.sortBy; this.sortDirection = "asc"; }
      await this.load(1);
    },
  },
});
