import { defineStore } from "pinia";
import { apiError } from "@/request";
import { productService } from "@/views/Products/service";
import type {
  ProductOptionsResponse,
  ProductSku,
  ProductSortField,
} from "@/views/Products/types";

const productSortFields: readonly ProductSortField[] = [
  "name",
  "skuCode",
  "price",
  "stock",
  "weight",
  "size",
  "updatedAt",
];

export const useProductStore = defineStore("products", {
  state: () => ({
    items: [] as ProductSku[],
    options: {
      categories: [],
      materials: [],
      patterns: [],
    } as ProductOptionsResponse,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    query: "",
    categoryId: "",
    materialId: "",
    patternId: "",
    sortBy: "updatedAt" as ProductSortField,
    sortDirection: "desc" as "asc" | "desc",
    loading: false,
    optionsLoading: false,
    error: "",
    listController: null as AbortController | null,
    optionsController: null as AbortController | null,
    listRequestId: 0,
    optionsRequestId: 0,
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
        const result = await productService.list(
          {
            page,
            limit: this.pagination.limit,
            query: this.query || undefined,
            categoryId: this.categoryId || undefined,
            materialId: this.materialId || undefined,
            patternId: this.patternId || undefined,
            sortBy: this.sortBy,
            sortDirection: this.sortDirection,
          },
          this.listController.signal,
        );
        if (requestId !== this.listRequestId) return;
        this.items = result.items;
        this.pagination = {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        };
      } catch (error) {
        if (requestId !== this.listRequestId) return;
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED") this.error = normalized.message;
      } finally {
        if (requestId === this.listRequestId) this.loading = false;
      }
    },

    async loadOptions(): Promise<void> {
      this.optionsController?.abort();
      this.optionsController = new AbortController();
      const requestId = ++this.optionsRequestId;
      this.optionsLoading = true;
      try {
        const result = await productService.options(
          this.optionsController.signal,
        );
        if (requestId === this.optionsRequestId) this.options = result;
      } catch (error) {
        if (requestId !== this.optionsRequestId) return;
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED" && !this.error) {
          this.error = normalized.message;
        }
      } finally {
        if (requestId === this.optionsRequestId) this.optionsLoading = false;
      }
    },

    async applySearch(value: string): Promise<void> {
      this.query = value.trim();
      await this.load(1);
    },

    async applyFilters(): Promise<void> {
      await this.load(1);
    },

    async clearFilters(): Promise<void> {
      this.categoryId = "";
      this.materialId = "";
      this.patternId = "";
      await this.load(1);
    },

    async applySort(key: string): Promise<void> {
      if (!productSortFields.includes(key as ProductSortField)) return;
      if (this.sortBy === key) {
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      } else {
        this.sortBy = key as ProductSortField;
        this.sortDirection = "asc";
      }
      await this.load(1);
    },

    disposeRequests(): void {
      this.listRequestId += 1;
      this.optionsRequestId += 1;
      this.listController?.abort();
      this.optionsController?.abort();
      this.listController = null;
      this.optionsController = null;
      this.loading = false;
      this.optionsLoading = false;
    },
  },
});
