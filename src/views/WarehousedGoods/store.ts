import { defineStore } from "pinia";
import { apiError } from "@/request";
import { warehouseService } from "@/views/WarehousedGoods/service";
import type {
  InventoryPricingType,
  StockLevelFilter,
  WarehouseItem,
  WarehouseOptionsResponse,
} from "@/views/WarehousedGoods/types";

export const useWarehouseStore = defineStore("warehouse", {
  state: () => ({
    items: [] as WarehouseItem[],
    options: {
      categories: [],
      materials: [],
      patterns: [],
      silverPrice: null,
    } as WarehouseOptionsResponse,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    query: "",
    categoryId: "",
    materialId: "",
    patternId: "",
    pricingType: "" as InventoryPricingType,
    stockLevel: "" as StockLevelFilter,
    sortBy: "updatedAt" as
      "name" | "code" | "importPrice" | "price" | "stock" | "updatedAt",
    sortDirection: "desc" as "asc" | "desc",
    selectedColumns: [
      "name",
      "price",
      "classificationTags",
      "stock",
      "updatedAt",
    ],
    loading: false,
    optionsLoading: false,
    error: "",
    message: "",
    deleteTarget: null as WarehouseItem | null,
    listController: null as AbortController | null,
    optionsController: null as AbortController | null,
    listRequestId: 0,
  }),
  actions: {
    async load(page = this.pagination.page): Promise<void> {
      this.listController?.abort();
      this.listController = new AbortController();
      const requestId = ++this.listRequestId;
      this.loading = true;
      this.error = "";
      try {
        const result = await warehouseService.list(
          {
            page,
            limit: this.pagination.limit,
            query: this.query || undefined,
            categoryId: this.categoryId || undefined,
            materialId: this.materialId || undefined,
            patternId: this.patternId || undefined,
            pricingType: this.pricingType || undefined,
            stockLevel: this.stockLevel || undefined,
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
      this.optionsLoading = true;
      try {
        this.options = await warehouseService.options(
          this.optionsController.signal,
        );
      } catch (error) {
        const normalized = apiError(error);
        if (normalized.code !== "ERR_CANCELED" && !this.error)
          this.error = normalized.message;
      } finally {
        this.optionsLoading = false;
      }
    },
    async applySearch(query: string): Promise<void> {
      this.query = query.trim();
      await this.load(1);
    },
    async applyFilters(): Promise<void> {
      await this.load(1);
    },
    async applySort(key: string): Promise<void> {
      if (!(warehouseDefinitionSortKeys as readonly string[]).includes(key))
        return;
      if (this.sortBy === key)
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      else {
        this.sortBy = key as typeof this.sortBy;
        this.sortDirection = "asc";
      }
      await this.load(1);
    },
    requestDelete(item: WarehouseItem): void {
      this.deleteTarget = item;
    },
    cancelDelete(): void {
      this.deleteTarget = null;
    },
    async confirmDelete(): Promise<void> {
      const target = this.deleteTarget;
      if (!target) return;
      this.deleteTarget = null;
      this.error = "";
      try {
        await warehouseService.remove(target.id);
        this.message = "Đã xóa hàng nhập kho";
        const page =
          this.items.length === 1 && this.pagination.page > 1
            ? this.pagination.page - 1
            : this.pagination.page;
        await this.load(page);
      } catch (error) {
        this.error = apiError(error).message;
      }
    },
  },
});

const warehouseDefinitionSortKeys = [
  "name",
  "code",
  "importPrice",
  "price",
  "stock",
  "updatedAt",
] as const;
