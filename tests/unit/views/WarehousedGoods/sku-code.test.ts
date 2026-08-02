import {
  abbreviateSkuPart,
  buildSkuCode,
  formatSkuSize,
  formatSkuWeight,
  normalizeSkuCode,
  suggestSkuCodes,
} from "@/views/WarehousedGoods/sku-code";
import {
  emptyWarehouseSku,
  type WarehouseSkuFormModel,
} from "@/views/WarehousedGoods/types";

describe("warehouse SKU codes", () => {
  it.each([
    ["Nhẫn", "NH"],
    ["Dây chuyền", "DC"],
    ["Bông mai", "BM"],
    ["Bạc 925", "B925"],
    ["Bạc Thái 925", "BT925"],
    ["Vàng 18K", "V18K"],
  ])("abbreviates %s as %s", (source, expected) => {
    expect(abbreviateSkuPart(source)).toBe(expected);
  });

  it("formats weight and size segments for staff-readable codes", () => {
    expect(formatSkuWeight(1)).toBe("1C");
    expect(formatSkuWeight(1.5)).toBe("1P5C");
    expect(formatSkuWeight(0.75)).toBe("0P75C");
    expect(formatSkuSize("Ni 12")).toBe("N12");
    expect(formatSkuSize("12")).toBe("N12");
    expect(formatSkuSize("Size M")).toBe("M");
    expect(formatSkuSize("")).toBe("");
  });

  it("builds the approved code with and without an optional size", () => {
    expect(
      buildSkuCode({
        category: "Nhẫn",
        material: "Bạc 925",
        pattern: "Bông mai",
        weight: 1.5,
        size: "Ni 12",
      }),
    ).toBe("NH-B925-BM-1P5C-N12");
    expect(
      buildSkuCode({
        category: "Dây chuyền",
        material: "Bạc Thái 925",
        pattern: "Trơn",
        weight: 2,
        size: "",
      }),
    ).toBe("DC-BT925-TR-2C");
  });

  it("normalizes manual codes to one uppercase ASCII representation", () => {
    expect(normalizeSkuCode("  nh-bạc 925 / bông mai  ")).toBe(
      "NH-BAC-925-BONG-MAI",
    );
  });

  it("reserves manual codes and suffixes colliding automatic rows", () => {
    const skus: WarehouseSkuFormModel[] = [
      emptyWarehouseSku({
        code: "NH-B925-BM-1P5C-N12",
        codeMode: "manual",
        weight: 1.5,
        size: "Ni 12",
      }),
      emptyWarehouseSku({ weight: 1.5, size: "Ni 12" }),
      emptyWarehouseSku({ weight: 1.5, size: "Ni 12" }),
    ];

    expect(
      suggestSkuCodes(skus, {
        category: "Nhẫn",
        material: "Bạc 925",
        pattern: "Bông mai",
      }).map((sku) => sku.code),
    ).toEqual([
      "NH-B925-BM-1P5C-N12",
      "NH-B925-BM-1P5C-N12-02",
      "NH-B925-BM-1P5C-N12-03",
    ]);
  });

  it("preserves an API-adjusted code while its generated source is unchanged", () => {
    const sku = emptyWarehouseSku({
      code: "NH-B925-BM-1P5C-N12-03",
      codeSource: "NH-B925-BM-1P5C-N12",
      codeMode: "auto",
      weight: 1.5,
      size: "Ni 12",
    });

    const [unchanged] = suggestSkuCodes([sku], {
      category: "Nhẫn",
      material: "Bạc 925",
      pattern: "Bông mai",
    });
    const [changed] = suggestSkuCodes([{ ...unchanged, size: "Ni 14" }], {
      category: "Nhẫn",
      material: "Bạc 925",
      pattern: "Bông mai",
    });

    expect(unchanged.code).toBe("NH-B925-BM-1P5C-N12-03");
    expect(unchanged.codeSource).toBe("NH-B925-BM-1P5C-N12");
    expect(changed.code).toBe("NH-B925-BM-1P5C-N14");
    expect(changed.codeSource).toBe("NH-B925-BM-1P5C-N14");
  });
});
