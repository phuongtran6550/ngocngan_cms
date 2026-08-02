import { productSkuSummary } from "@/views/WarehousedGoods/product-summary";
import type { WarehouseSku } from "@/views/WarehousedGoods/types";

function sku(overrides: Partial<WarehouseSku> = {}): WarehouseSku {
  return {
    id: "sku-1",
    code: "NH-V18K-TR-1C-N12",
    size: "12",
    weight: 1.25,
    price: 850_000,
    laborCost: 0,
    platingCost: 0,
    importPrice: 500_000,
    stock: 3,
    ...overrides,
  };
}

describe("productSkuSummary", () => {
  it("formats price, weight, numeric ni and total stock ranges", () => {
    expect(
      productSkuSummary([
        sku(),
        sku({
          id: "sku-2",
          size: "14",
          weight: 1.4,
          price: 1_100_000,
          stock: 5,
        }),
      ]),
    ).toEqual({
      price: "850.000 ₫ – 1.100.000 ₫",
      weight: "1,25 – 1,4 chỉ",
      size: "Ni 12 – 14",
      skuCount: 2,
      stock: 8,
    });
  });

  it("uses one value when every SKU value is equal", () => {
    expect(productSkuSummary([sku()])).toEqual({
      price: "850.000 ₫",
      weight: "1,25 chỉ",
      size: "Ni 12",
      skuCount: 1,
      stock: 3,
    });
  });

  it("ignores empty ni values and sorts numeric values numerically", () => {
    expect(productSkuSummary([sku({ size: "" })]).size).toBe("Không áp dụng");
    expect(
      productSkuSummary([sku({ size: "10" }), sku({ id: "sku-2", size: "2" })])
        .size,
    ).toBe("Ni 2 – 10");
  });

  it("preserves deduplicated legacy text sizes without a false range", () => {
    expect(
      productSkuSummary([
        sku({ size: " S " }),
        sku({ id: "sku-2", size: "M" }),
        sku({ id: "sku-3", size: "S" }),
      ]).size,
    ).toBe("S, M");
  });

  it("degrades malformed numeric values without crashing", () => {
    const malformed = sku({
      price: Number.NaN,
      weight: Number.POSITIVE_INFINITY,
      stock: Number.NaN,
    });

    expect(productSkuSummary([malformed])).toEqual({
      price: "—",
      weight: "—",
      size: "Ni 12",
      skuCount: 1,
      stock: 0,
    });
  });
});
