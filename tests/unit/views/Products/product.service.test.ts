import { vi } from "vitest";
import { request } from "@/request";
import { productService } from "@/views/Products/service";
import type { ProductSku, ProductSkuHistoryResponse } from "@/views/Products/types";

const sku: ProductSku = {
  id: "sku-1",
  productId: "warehouse-1",
  barcode: "10000000",
  skuCode: "NH-B925-BM-1C-N12",
  name: "Nhẫn Bông mai",
  thumbnail: "/uploads/product.jpg",
  images: ["/uploads/product.jpg"],
  categoryId: "category-1",
  category: "Nhẫn",
  materialId: "material-1",
  material: "Bạc 925",
  patternId: "pattern-1",
  pattern: "Bông mai",
  pricingType: "Đồ cân",
  size: "12",
  weight: 1.25,
  price: 850000,
  stock: 2,
  laborCost: 150000,
  platingCost: 20000,
  importPrice: null,
  status: "active",
};

const history: ProductSkuHistoryResponse = {
  items: [
    {
      id: "history-1",
      skuId: "sku-1",
      skuCode: sku.skuCode,
      action: "updated",
      changes: [{ field: "stock", before: 2, after: 5 }],
      silverPriceBefore: null,
      silverPriceAfter: null,
      actor: { id: "user-1", name: "Ngọc Châu", username: "admin" },
      changedAt: "2026-08-02T08:00:00.000Z",
    },
  ],
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
};

describe("product service", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the read-only product API and warehouse option source", async () => {
    const get = vi.spyOn(request, "get").mockImplementation(async (path) => {
      if (path === "/products") {
        return {
          data: { items: [sku], page: 1, limit: 20, total: 1, totalPages: 1 },
        } as never;
      }
      if (path === "/warehoused-goods/options") {
        return {
          data: { categories: [], materials: [], patterns: [] },
        } as never;
      }
      if (path === "/products/sku-1/history") {
        return { data: history } as never;
      }
      return { data: sku } as never;
    });

    await expect(
      productService.list({ page: 1, limit: 20, query: "nhẫn" }),
    ).resolves.toMatchObject({ items: [sku] });
    await expect(productService.detail("sku-1")).resolves.toEqual(sku);
    await expect(
      productService.history("sku-1", { page: 1, limit: 20 }),
    ).resolves.toEqual(history);
    await expect(productService.byBarcode("10000000")).resolves.toEqual(sku);
    await productService.options();

    expect(get).toHaveBeenCalledWith("/products", {
      params: { page: 1, limit: 20, query: "nhẫn" },
      signal: undefined,
    });
    expect(get).toHaveBeenCalledWith("/products/sku-1", {
      signal: undefined,
    });
    expect(get).toHaveBeenCalledWith("/products/sku-1/history", {
      params: { page: 1, limit: 20 },
      signal: undefined,
    });
    expect(get).toHaveBeenCalledWith("/products/barcode/10000000", {
      signal: undefined,
    });
    expect(get).toHaveBeenCalledWith("/warehoused-goods/options", {
      signal: undefined,
    });
  });

  it("rejects malformed SKU responses at the feature boundary", async () => {
    vi.spyOn(request, "get").mockResolvedValue({ data: { id: "sku-1" } } as never);

    await expect(productService.detail("sku-1")).rejects.toMatchObject({
      code: "INVALID_PRODUCT_RESPONSE",
    });
  });

  it("rejects rows whose required public SKU fields have invalid types", async () => {
    vi.spyOn(request, "get").mockResolvedValue({
      data: {
        ...sku,
        size: null,
      },
    } as never);

    await expect(productService.detail("sku-1")).rejects.toMatchObject({
      code: "INVALID_PRODUCT_RESPONSE",
    });
  });

  it("rejects malformed pagination metadata from the product list", async () => {
    vi.spyOn(request, "get").mockResolvedValue({
      data: {
        items: [sku],
        page: 1,
        limit: 20,
        total: "1",
        totalPages: 1,
      },
    } as never);

    await expect(
      productService.list({ page: 1, limit: 20 }),
    ).rejects.toMatchObject({ code: "INVALID_PRODUCT_RESPONSE" });
  });

  it("rejects malformed SKU history values", async () => {
    vi.spyOn(request, "get").mockResolvedValue({
      data: {
        ...history,
        items: [
          {
            ...history.items[0],
            changes: [{ field: "stock", before: 2, after: { value: 5 } }],
          },
        ],
      },
    } as never);

    await expect(
      productService.history("sku-1", { page: 1, limit: 20 }),
    ).rejects.toMatchObject({ code: "INVALID_PRODUCT_RESPONSE" });
  });

  it("rejects malformed classification options", async () => {
    vi.spyOn(request, "get").mockResolvedValue({
      data: {
        categories: [{ id: "category-1", name: null, type: "category" }],
        materials: [],
        patterns: [],
      },
    } as never);

    await expect(productService.options()).rejects.toMatchObject({
      code: "INVALID_PRODUCT_RESPONSE",
    });
  });
});
