import { defineStore } from "pinia";
import { readStoredCart, writeStoredCart } from "@/views/Orders/cart-storage";
import type { OrderCartLine } from "@/views/Orders/types";
import type { ProductSku } from "@/views/Products/types";

export interface CartMutationResult {
  ok: boolean;
  message: string;
  quantity: number;
}

function lineFromSku(sku: ProductSku, quantity = 1): OrderCartLine {
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
  };
}

export const useSalesCartStore = defineStore("sales-cart", {
  state: () => ({
    lines: [] as OrderCartLine[],
    initialized: false,
  }),
  getters: {
    itemQuantity: (state): number => state.lines.reduce((sum, line) => sum + line.quantity, 0),
    total: (state): number => state.lines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    ),
    hasStockConflict: (state): boolean => state.lines.some(
      (line) => line.status !== "active" || line.stock < line.quantity,
    ),
  },
  actions: {
    initialize(): void {
      if (this.initialized) return;
      this.lines = readStoredCart();
      this.initialized = true;
    },
    persist(): void {
      if (this.initialized) writeStoredCart(this.lines);
    },
    add(sku: ProductSku): CartMutationResult {
      this.initialize();
      const existing = this.lines.find((line) => line.skuId === sku.id);
      if (existing) {
        Object.assign(existing, lineFromSku(sku, existing.quantity));
        if (sku.status !== "active" || sku.stock <= 0) {
          this.persist();
          return { ok: false, message: "Sản phẩm đã hết hàng hoặc ngừng bán", quantity: existing.quantity };
        }
        if (existing.quantity >= sku.stock) {
          this.persist();
          return { ok: false, message: `SKU chỉ còn ${sku.stock} sản phẩm`, quantity: existing.quantity };
        }
        existing.quantity += 1;
        this.persist();
        return { ok: true, message: `Đã tăng lên ${existing.quantity}`, quantity: existing.quantity };
      }
      if (sku.status !== "active" || sku.stock <= 0) {
        return { ok: false, message: "Sản phẩm đã hết hàng hoặc ngừng bán", quantity: 0 };
      }
      this.lines.push(lineFromSku(sku));
      this.persist();
      return { ok: true, message: "Đã thêm vào giỏ hàng", quantity: 1 };
    },
    refreshSku(sku: ProductSku): void {
      const existing = this.lines.find((line) => line.skuId === sku.id);
      if (!existing) return;
      Object.assign(existing, lineFromSku(sku, existing.quantity));
      this.persist();
    },
    markUnavailable(skuId: string): void {
      const existing = this.lines.find((line) => line.skuId === skuId);
      if (!existing) return;
      existing.status = "inactive";
      existing.stock = 0;
      this.persist();
    },
    increment(skuId: string): CartMutationResult {
      const line = this.lines.find((item) => item.skuId === skuId);
      if (!line) return { ok: false, message: "Không tìm thấy SKU trong giỏ", quantity: 0 };
      if (line.status !== "active" || line.quantity >= line.stock) {
        return { ok: false, message: `SKU chỉ còn ${line.stock} sản phẩm`, quantity: line.quantity };
      }
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
      this.persist();
    },
    clear(): void {
      this.lines = [];
      this.persist();
    },
  },
});
