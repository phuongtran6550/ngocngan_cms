import { defineStore } from "pinia";
import { apiError } from "@/request";
import { orderService } from "@/views/Orders/service";
import type {
  Order,
  OrderFormModel,
  OrderOptionsResponse,
  OrderStatus,
  CustomerInfoStatus,
  OrderStatusCounts,
  OrderTypeFilter,
} from "@/views/Orders/types";
import { orderWithDisplayFields } from "@/views/Orders/types";
import { optimizeImage } from "@/utils/image-optimizer";

const orderSortKeys = ["name", "phone", "price", "status", "createdAt", "updatedAt"] as const;

export const useOrderStore = defineStore("orders", {
  state: () => ({
    items: [] as Order[],
    missingItems: [] as Order[],
    options: { categories: [] } as OrderOptionsResponse,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    missingPagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    query: "",
    type: "" as OrderTypeFilter,
    status: "" as OrderStatus | "",
    customerInfoStatus: "" as CustomerInfoStatus | "",
    from: "",
    to: "",
    counts: { all: 0, completed: 0, returned: 0, cancelled: 0, complete: 0, ocrProcessing: 0, reviewRequired: 0, manualRequired: 0 } as OrderStatusCounts,
    sortBy: "updatedAt" as (typeof orderSortKeys)[number],
    sortDirection: "desc" as "asc" | "desc",
    selectedColumns: ["thumbnail", "orderCode", "customerDisplay", "productSummary", "itemQuantity", "price", "customerInfoStatus", "status", "createdByName", "createdAt"],
    loading: false,
    missingLoading: false,
    optionsLoading: false,
    mediaBusy: false,
    mediaProgress: 0,
    saving: false,
    error: "",
    message: "",
    deleteTarget: null as Order | null,
    draft: null as Order | null,
    listController: null as AbortController | null,
    missingController: null as AbortController | null,
    optionsController: null as AbortController | null,
    listRequestId: 0,
    missingRequestId: 0,
  }),
  actions: {
    async load(page?: number): Promise<void> {
      page ??= this.pagination.page;
      this.listController?.abort();
      this.listController = new AbortController();
      const requestId = ++this.listRequestId;
      this.loading = true;
      this.error = "";
      try {
        const result = await orderService.list({
          page,
          limit: this.pagination.limit,
          query: this.query || undefined,
          type: this.type || undefined,
          status: this.status || undefined,
          customerInfoStatus: this.customerInfoStatus || undefined,
          from: this.from || undefined,
          to: this.to || undefined,
          sortBy: this.sortBy,
          sortDirection: this.sortDirection,
        }, this.listController.signal);
        if (requestId !== this.listRequestId) return;
        this.items = result.items.map(orderWithDisplayFields);
        this.pagination = { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages };
      } catch (error) {
        if (requestId !== this.listRequestId) return;
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED") this.error = normalized.message;
      } finally {
        if (requestId === this.listRequestId) this.loading = false;
      }
    },
    async loadCounts(): Promise<void> {
      try { this.counts = await orderService.counts(); }
      catch (error) { if (!this.error) this.error = apiError(error).message; }
    },
    async loadOptions(): Promise<void> {
      this.optionsController?.abort();
      this.optionsController = new AbortController();
      this.optionsLoading = true;
      try {
        this.options = await orderService.options(this.optionsController.signal);
      } catch (error) {
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED" && !this.error) this.error = normalized.message;
      } finally {
        this.optionsLoading = false;
      }
    },
    async loadMissing(page?: number, showLoading = true): Promise<void> {
      page ??= this.missingPagination.page;
      this.missingController?.abort();
      this.missingController = new AbortController();
      const requestId = ++this.missingRequestId;
      if (showLoading) this.missingLoading = true;
      this.error = "";
      try {
        const result = await orderService.missing({
          page,
          limit: this.missingPagination.limit,
          query: this.query || undefined,
          customerInfoStatus: this.customerInfoStatus || undefined,
        }, this.missingController.signal);
        if (requestId !== this.missingRequestId) return;
        this.missingItems = result.items.map(orderWithDisplayFields);
        this.missingPagination = {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        };
      } catch (error) {
        if (requestId !== this.missingRequestId) return;
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED") this.error = normalized.message;
      } finally {
        if (requestId === this.missingRequestId && showLoading) this.missingLoading = false;
      }
    },
    async refreshMissing(): Promise<void> {
      await this.loadMissing(this.missingPagination.page, false);
    },
    async applySearch(query: string): Promise<void> {
      this.query = query.trim();
      await this.load(1);
    },
    async applyFilters(): Promise<void> { await this.load(1); },
    async applySort(key: string): Promise<void> {
      if (!(orderSortKeys as readonly string[]).includes(key)) return;
      if (this.sortBy === key) this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      else { this.sortBy = key as typeof this.sortBy; this.sortDirection = "asc"; }
      await this.load(1);
    },
    async capture(file: File): Promise<Order> {
      this.mediaBusy = true;
      this.mediaProgress = 0;
      this.error = "";
      try {
        const optimized = await optimizeImage(file, (progress) => {
          this.mediaProgress = Math.round(progress * 0.5);
        });
        const onUpload = (progress: number) => { this.mediaProgress = 50 + Math.round(progress * 0.5); };
        this.draft = this.draft
          ? await orderService.updateThumbnail(this.draft.id, optimized, onUpload)
          : await orderService.createDraft(optimized, onUpload);
        this.mediaProgress = 100;
        return this.draft;
      } catch (error) {
        this.error = apiError(error).message;
        throw error;
      } finally {
        this.mediaBusy = false;
      }
    },
    async replaceThumbnail(order: Order, file: File): Promise<Order> {
      this.mediaBusy = true;
      this.mediaProgress = 0;
      this.error = "";
      try {
        const optimized = await optimizeImage(file, (progress) => {
          this.mediaProgress = Math.round(progress * 0.5);
        });
        const updated = await orderService.updateThumbnail(order.id, optimized, (progress) => {
          this.mediaProgress = 50 + Math.round(progress * 0.5);
        });
        this.mediaProgress = 100;
        return updated;
      } catch (error) {
        this.error = apiError(error).message;
        throw error;
      } finally {
        this.mediaBusy = false;
      }
    },
    async saveDraft(input: OrderFormModel): Promise<Order> {
      if (!this.draft) throw new Error("Vui lòng chụp hoặc chọn ảnh trước khi lưu đơn hàng");
      this.saving = true;
      this.error = "";
      try {
        this.draft = await orderService.update(this.draft.id, input);
        return this.draft;
      } catch (error) {
        this.error = apiError(error).message;
        throw error;
      } finally {
        this.saving = false;
      }
    },
    resetDraft(): void {
      this.draft = null;
      this.mediaProgress = 0;
      this.error = "";
      this.message = "";
    },
    requestDelete(item: Order): void { this.deleteTarget = item; },
    cancelDelete(): void { this.deleteTarget = null; },
    async confirmDelete(): Promise<void> {
      const target = this.deleteTarget;
      if (!target) return;
      this.deleteTarget = null;
      this.error = "";
      try {
        await orderService.remove(target.id);
        this.message = "Đã hủy đơn hàng";
        await this.load(this.pagination.page);
        await this.loadCounts();
      } catch (error) {
        this.error = apiError(error).message;
      }
    },
  },
});
