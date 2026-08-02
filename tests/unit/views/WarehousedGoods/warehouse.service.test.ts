import { vi } from "vitest";
import { request, unwrapApiPayload } from "@/request";
import { warehouseService } from "@/views/WarehousedGoods/service";
import { emptyWarehouseForm } from "@/views/WarehousedGoods/types";

describe("warehouse service", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends list filters through the shared request client", async () => {
    const get = vi.spyOn(request, "get").mockResolvedValue({
      data: { items: [], page: 1, limit: 20, total: 0, totalPages: 0 },
    } as never);

    await warehouseService.list({
      page: 1,
      limit: 20,
      query: "nhẫn",
      categoryId: "category-1",
      status: "active",
      sortBy: "importPrice",
      sortDirection: "desc",
    });

    expect(get).toHaveBeenCalledWith("/warehoused-goods", {
      params: expect.objectContaining({
        query: "nhẫn",
        categoryId: "category-1",
        status: "active",
      }),
      signal: undefined,
    });
  });

  it("returns the direct item produced by the shared response boundary", async () => {
    const item = { id: "warehouse-1", name: "Nhẫn Solis" };
    const normalized = unwrapApiPayload({
      status: "success",
      detail: item,
    });
    vi.spyOn(request, "get").mockResolvedValue({ data: normalized } as never);
    vi.spyOn(request, "post").mockResolvedValue({ data: normalized } as never);
    vi.spyOn(request, "patch").mockResolvedValue({ data: normalized } as never);

    await expect(warehouseService.detail(item.id)).resolves.toEqual(item);
    await expect(
      warehouseService.create(emptyWarehouseForm()),
    ).resolves.toEqual(item);
    await expect(
      warehouseService.update(item.id, emptyWarehouseForm()),
    ).resolves.toEqual(item);
  });

  it("rejects an invalid normalized item before a page reads its id", async () => {
    vi.spyOn(request, "post").mockResolvedValue({ data: undefined } as never);

    await expect(
      warehouseService.create(emptyWarehouseForm()),
    ).rejects.toMatchObject({
      message: "Máy chủ không trả về dữ liệu hàng nhập kho hợp lệ",
      code: "INVALID_WAREHOUSE_RESPONSE",
    });
  });

  it("creates multipart inventory with only the requested product and SKU fields", async () => {
    const post = vi
      .spyOn(request, "post")
      .mockResolvedValue({ data: { id: "warehouse-1" } } as never);
    const file = new File(["image"], "item.jpg", { type: "image/jpeg" });

    await warehouseService.create({
      code: "NHAN-001",
      name: "Nhẫn",
      supplierName: "Nguồn A",
      supplierPhone: "0901",
      categoryId: "category-1",
      materialId: "material-1",
      patternId: "pattern-1",
      pricingType: "Đồ món",
      price: 200,
      importPrice: 100,
      laborCost: 20,
      platingCost: 10,
      weight: 1.2,
      size: "12",
      stock: 1,
      sold: 0,
      pending: 0,
      status: "active",
      thumbnail: file,
      skus: [
        {
          clientId: "sku-1",
          code: "NH-B925-BM-1P2C-N12",
          codeMode: "manual",
          size: "12",
          weight: 1.2,
          price: 200,
          importPrice: 100,
          laborCost: 0,
          platingCost: 0,
          stock: 4,
        },
      ],
    });

    const body = post.mock.calls[0]?.[1] as FormData;
    expect(body.get("name")).toBe("Nhẫn");
    expect(body.get("categoryId")).toBe("category-1");
    expect(body.get("materialId")).toBe("material-1");
    expect(body.get("patternId")).toBe("pattern-1");
    expect(body.get("pricingType")).toBe("Đồ món");
    expect(body.get("supplierName")).toBeNull();
    expect(body.get("supplierPhone")).toBeNull();
    expect(body.get("status")).toBeNull();
    expect(body.get("sold")).toBeNull();
    expect(body.get("pending")).toBeNull();
    expect(body.get("importPrice")).toBeNull();
    expect(body.get("price")).toBeNull();
    expect(JSON.parse(String(body.get("skus")))).toEqual([
      {
        code: "NH-B925-BM-1P2C-N12",
        codeMode: "manual",
        size: "12",
        weight: 1.2,
        price: 200,
        importPrice: 100,
        laborCost: 0,
        platingCost: 0,
        stock: 4,
      },
    ]);
    expect(body.get("thumbnail")).toBe(file);
  });

  it("requests usable SKU codes through one ordered batch request", async () => {
    const post = vi.spyOn(request, "post").mockResolvedValue({
      data: {
        items: [{ code: "NH-B925-BM-1C-02" }],
      },
    } as never);
    const controller = new AbortController();

    const result = await warehouseService.checkSkuCodes(
      [{ code: "NH-B925-BM-1C" }],
      controller.signal,
    );

    expect(post).toHaveBeenCalledWith(
      "/warehoused-goods/sku-codes/check",
      { skus: [{ code: "NH-B925-BM-1C" }] },
      { signal: controller.signal },
    );
    expect(result.items[0]?.code).toBe("NH-B925-BM-1C-02");
  });

  it("sends the requested label quantity in one print request", async () => {
    const post = vi.spyOn(request, "post").mockResolvedValue({
      data: {
        queued: true,
        printer: "Godex_G500",
        jobId: "Godex_G500-25",
        quantity: 6,
      },
    } as never);

    const result = await warehouseService.printLabel(
      "warehouse-1",
      "sku-1",
      6,
    );

    expect(post).toHaveBeenCalledWith(
      "/warehoused-goods/warehouse-1/skus/sku-1/print-label",
      { quantity: 6 },
    );
    expect(result.quantity).toBe(6);
  });

  it("omits null import price for weighted inventory", async () => {
    const post = vi
      .spyOn(request, "post")
      .mockResolvedValue({ data: { id: "warehouse-1" } } as never);

    await warehouseService.create({
      code: "NHAN-002",
      name: "Nhẫn cân",
      supplierName: "",
      supplierPhone: "",
      categoryId: "category-1",
      materialId: "material-1",
      patternId: "pattern-1",
      pricingType: "Đồ cân",
      price: 600_000,
      importPrice: null,
      laborCost: 200_000,
      platingCost: 50_000,
      weight: 1.5,
      size: "12",
      stock: 0,
      sold: 0,
      pending: 0,
      status: "active",
      thumbnail: null,
      skus: [],
    });

    const body = post.mock.calls[0]?.[1] as FormData;
    expect(body.get("importPrice")).toBeNull();
  });

  it("sends only editable product fields when updating inventory", async () => {
    const patch = vi
      .spyOn(request, "patch")
      .mockResolvedValue({ data: { id: "warehouse-1" } } as never);

    await warehouseService.update("inventory-1", {
      code: "NHAN-001",
      name: "Nhẫn",
      supplierName: "",
      supplierPhone: "",
      categoryId: "",
      materialId: "",
      patternId: "",
      pricingType: "",
      price: 200,
      importPrice: 100,
      laborCost: 20,
      platingCost: 10,
      weight: 1.2,
      size: "",
      stock: 1,
      sold: 0,
      pending: 0,
      status: "active",
      thumbnail: null,
      skus: [],
    });

    const body = patch.mock.calls[0]?.[1] as FormData;
    expect(body.get("supplierName")).toBeNull();
    expect(body.get("supplierPhone")).toBeNull();
    expect(body.get("status")).toBeNull();
    expect(body.get("sold")).toBeNull();
    expect(body.get("pending")).toBeNull();
    expect(body.get("categoryId")).toBe("");
    expect(body.get("materialId")).toBe("");
    expect(body.get("pricingType")).toBe("");
    expect(body.get("size")).toBeNull();
  });
});
