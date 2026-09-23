import { defineStore } from "pinia";
import { readStoredCart, writeStoredCart } from "@/views/Orders/cart-storage";
import type { OrderCartLine } from "@/views/Orders/types";
import { productService } from "@/views/Products/service";
import type { ProductSku } from "@/views/Products/types";
import { calculateSkuRawPrice } from "@/views/WarehousedGoods/pricing";

export interface CartMutationResult {
  ok: boolean;
  message: string;
  quantity: number;
  rawPrice?: number | null;
}

function lineFromSku(
  sku: ProductSku,
  quantity = 1,
  silverPrice?: number | null,
  customMarks?: readonly number[],
): OrderCartLine {
  return {
    skuId: sku.id,
    productId: sku.productId,
    barcode: sku.barcode,
    skuCode: sku.skuCode,
    productName: sku.name,
    thumbnail: sku.thumbnail,
    category: sku.category,
    material: sku.material,
    pattern: sku.pattern,
    size: sku.size,
    weight: sku.weight,
    unitPrice: sku.price,
    stock: sku.stock,
    status: sku.status,
    quantity,
    pricingType: sku.pricingType,
    laborCost: sku.laborCost,
    platingCost: sku.platingCost,
    importPrice: sku.importPrice,
    rawPrice: calculateSkuRawPrice(sku, silverPrice, customMarks),
    manualPrice: sku.manualPrice,
  };
}

export function isMissingSkuError(error: unknown): boolean {
  const value = error as { status?: unknown; code?: unknown } | null;
  return value?.status === 404 || value?.code === "PRODUCT_SKU_NOT_FOUND";
}

export const useSalesCartStore = defineStore("sales-cart", {
  state: () => ({
    lines: [] as OrderCartLine[],
    unverifiedSkuIds: [] as string[],
    initialized: false,
    silverPrice: null as number | null,
    roundingMarks: null as { piece?: number[]; weighted?: number[] } | null,
  }),
  getters: {
    itemQuantity: (state): number =>
      state.lines.reduce((sum, line) => sum + line.quantity, 0),
    total: (state): number =>
      state.lines.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0,
      ),
    rawTotal: (state): number =>
      state.lines.reduce(
        (sum, line) => sum + (line.rawPrice ?? line.unitPrice) * line.quantity,
        0,
      ),
    totalWeight: (state): number =>
      state.lines.reduce(
        (sum, line) =>
          line.pricingType === "Đồ cân" && Number.isFinite(line.weight) && line.weight > 0
            ? sum + line.weight * line.quantity
            : sum,
        0,
      ),
    totalLaborCost: (state): number =>
      state.lines.reduce(
        (sum, line) =>
          Number.isFinite(line.laborCost) && (line.laborCost ?? 0) > 0
            ? sum + (line.laborCost ?? 0) * line.quantity
            : sum,
        0,
      ),
    totalPlatingCost: (state): number =>
      state.lines.reduce(
        (sum, line) =>
          Number.isFinite(line.platingCost) && (line.platingCost ?? 0) > 0
            ? sum + (line.platingCost ?? 0) * line.quantity
            : sum,
        0,
      ),
    totalImportPrice: (state): number =>
      state.lines.reduce(
        (sum, line) =>
          Number.isFinite(line.importPrice) && (line.importPrice ?? 0) > 0
            ? sum + (line.importPrice ?? 0) * line.quantity
            : sum,
        0,
      ),
    hasStockConflict: (): boolean => false,
    hasUnverifiedStock: (state): boolean => state.unverifiedSkuIds.length > 0,
    isStockUnverified:
      (state) =>
      (skuId: string): boolean =>
        state.unverifiedSkuIds.includes(skuId),
  },
  actions: {
    initialize(): void {
      if (this.initialized) return;
      this.lines = readStoredCart();
      this.initialized = true;
      void this.loadSilverPrice();
    },
    async loadSilverPrice(): Promise<number | null> {
      if (this.silverPrice !== null && this.silverPrice > 0) {
        return this.silverPrice;
      }
      try {
        const options = await productService.options();
        if (typeof options.silverPrice === "number" && options.silverPrice > 0) {
          this.silverPrice = options.silverPrice;
        }
        if (options.roundingMarks) {
          this.roundingMarks = options.roundingMarks;
        }
        this.updateRawPrices();
        return this.silverPrice;
      } catch {
        // ignore network error
      }
      return null;
    },
    updateRawPrices(): void {
      let changed = false;
      for (const line of this.lines) {
        const customMarks =
          line.pricingType === "Đồ cân"
            ? this.roundingMarks?.weighted
            : this.roundingMarks?.piece;
        const calculated = calculateSkuRawPrice(
          line,
          this.silverPrice,
          customMarks,
        );
        if (calculated !== null && calculated !== line.rawPrice) {
          line.rawPrice = calculated;
          changed = true;
        }
      }
      if (changed) this.persist();
    },
    persist(): void {
      if (this.initialized) writeStoredCart(this.lines);
    },
    add(sku: ProductSku): CartMutationResult {
      this.initialize();
      const customMarks =
        sku.pricingType === "Đồ cân"
          ? this.roundingMarks?.weighted
          : this.roundingMarks?.piece;
      const existing = this.lines.find((line) => line.skuId === sku.id);
      if (existing) {
        Object.assign(
          existing,
          lineFromSku(sku, existing.quantity, this.silverPrice, customMarks),
        );
        this.markVerified(sku.id);
        existing.quantity += 1;
        this.persist();
        return {
          ok: true,
          message: `Đã tăng lên ${existing.quantity}`,
          quantity: existing.quantity,
          rawPrice: existing.rawPrice,
        };
      }
      const newLine = lineFromSku(sku, 1, this.silverPrice, customMarks);
      this.lines.push(newLine);
      this.markVerified(sku.id);
      this.persist();
      return {
        ok: true,
        message: "Đã thêm vào giỏ hàng",
        quantity: 1,
        rawPrice: newLine.rawPrice,
      };
    },
    refreshSku(sku: ProductSku): void {
      const existing = this.lines.find((line) => line.skuId === sku.id);
      if (!existing) return;
      const customMarks =
        sku.pricingType === "Đồ cân"
          ? this.roundingMarks?.weighted
          : this.roundingMarks?.piece;
      Object.assign(
        existing,
        lineFromSku(sku, existing.quantity, this.silverPrice, customMarks),
      );
      this.markVerified(sku.id);
      this.persist();
    },
    markUnverified(skuId: string): void {
      if (
        this.lines.some((line) => line.skuId === skuId) &&
        !this.unverifiedSkuIds.includes(skuId)
      )
        this.unverifiedSkuIds.push(skuId);
    },
    markVerified(skuId: string): void {
      this.unverifiedSkuIds = this.unverifiedSkuIds.filter(
        (id) => id !== skuId,
      );
    },
    markUnavailable(skuId: string): void {
      const existing = this.lines.find((line) => line.skuId === skuId);
      if (!existing) return;
      existing.status = "inactive";
      existing.stock = 0;
      this.markVerified(skuId);
      this.persist();
    },
    increment(skuId: string): CartMutationResult {
      const line = this.lines.find((item) => item.skuId === skuId);
      if (!line)
        return {
          ok: false,
          message: "Không tìm thấy SKU trong giỏ",
          quantity: 0,
        };
      line.quantity += 1;
      this.persist();
      return { ok: true, message: "Đã tăng số lượng", quantity: line.quantity };
    },
    decrement(skuId: string): void {
      const line = this.lines.find((item) => item.skuId === skuId);
      if (!line) return;
      if (line.quantity <= 1) this.remove(skuId);
      else {
        line.quantity -= 1;
        this.persist();
      }
    },
    remove(skuId: string): void {
      this.lines = this.lines.filter((line) => line.skuId !== skuId);
      this.markVerified(skuId);
      this.persist();
    },
    clear(): void {
      this.lines = [];
      this.unverifiedSkuIds = [];
      this.persist();
    },
  },
});
