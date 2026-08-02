import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { vi } from "vitest";
import ProductDetailPage from "@/views/Products/detail.vue";
import { productService } from "@/views/Products/service";
import type { ProductSku, ProductSkuHistoryResponse } from "@/views/Products/types";
import { silverPriceService } from "@/views/Settings/service";
import type { SilverPriceStatus } from "@/views/Settings/types";

const weightedSku: ProductSku = {
  id: "sku-1",
  productId: "warehouse-1",
  barcode: "10000000",
  skuCode: "NH-B925-BM-1C-N12",
  name: "Nhẫn Bông mai",
  thumbnail: "/uploads/product.jpg",
  images: ["/uploads/product-side.jpg"],
  categoryId: "category-1",
  category: "Nhẫn",
  materialId: "material-1",
  material: "Bạc 925",
  patternId: "pattern-1",
  pattern: "Bông mai",
  pricingType: "Đồ cân",
  size: "12",
  weight: 1.25,
  price: 850_000,
  stock: 2,
  laborCost: 150_000,
  platingCost: 20_000,
  importPrice: null,
  status: "active",
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: "2026-08-02T08:00:00.000Z",
};

const silverPriceStatus: SilverPriceStatus = {
  silverPrice: 220_000,
  weightedProductCount: 1,
  updatedAt: "2026-08-02T08:00:00.000Z",
  updatedBy: "user-1",
};

async function mountDetail(
  item: ProductSku = weightedSku,
  silverPriceResult: SilverPriceStatus | Error = silverPriceStatus,
) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const silverPriceSpy = vi.spyOn(silverPriceService, "status");
  if (silverPriceResult instanceof Error) {
    silverPriceSpy.mockRejectedValue(silverPriceResult);
  } else {
    silverPriceSpy.mockResolvedValue(silverPriceResult);
  }
  vi.spyOn(productService, "detail").mockResolvedValue(item);
  vi.spyOn(productService, "history").mockResolvedValue({
    items: [
      {
        id: "history-1",
        skuId: item.id,
        skuCode: item.skuCode,
        action: "updated",
        changes: [{ field: "stock", before: 2, after: 5 }],
        silverPriceBefore: 220_000,
        silverPriceAfter: 220_000,
        actor: { id: "user-1", name: "Ngọc Châu", username: "admin" },
        changedAt: "2026-08-02T08:00:00.000Z",
      },
    ],
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  } satisfies ProductSkuHistoryResponse);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/products", component: { template: "<div />" } },
      { path: "/products/:skuId", component: { template: "<div />" } },
      { path: "/warehoused-goods/:id", component: { template: "<div />" } },
    ],
  });
  await router.push(`/products/${item.id}`);
  await router.isReady();
  const wrapper = mount(ProductDetailPage, {
    global: { plugins: [pinia, router], stubs: { Teleport: true } },
  });
  await flushPromises();
  return { wrapper, router };
}

describe("ProductDetailPage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders all exact weighted-SKU values without mutation or sibling controls", async () => {
    const { wrapper } = await mountDetail();

    expect(productService.detail).toHaveBeenCalledWith(
      "sku-1",
      expect.any(AbortSignal),
    );
    expect(productService.history).toHaveBeenCalledWith(
      "sku-1",
      { page: 1, limit: 20 },
      expect.any(AbortSignal),
    );
    expect(silverPriceService.status).toHaveBeenCalledWith(
      expect.any(AbortSignal),
    );
    expect(wrapper.text()).toContain("NH-B925-BM-1C-N12");
    expect(wrapper.text()).toContain("850.000 ₫");
    expect(wrapper.text()).toContain("Còn 2 sản phẩm trong kho");
    expect(wrapper.text()).toContain("Trọng lượng");
    expect(wrapper.text()).toContain("1,25 chỉ");
    expect(wrapper.text()).toContain("Ni");
    expect(wrapper.text()).toContain("Ni 12");
    expect(wrapper.text()).toContain("Nhẫn");
    expect(wrapper.text()).toContain("Bạc 925");
    expect(wrapper.text()).toContain("Bông mai");
    expect(wrapper.text()).toContain("Tiền công");
    expect(wrapper.text()).toContain("150.000 ₫");
    expect(wrapper.text()).toContain("Tiền xi");
    expect(wrapper.text()).toContain("20.000 ₫");
    expect(wrapper.text()).toContain("Thông tin sản phẩm");
    expect(wrapper.text()).toContain("Chi phí SKU");
    const costCard = wrapper
      .findAll(".sku-detail-card")
      .find((card) => card.text().includes("Chi phí SKU"));
    expect(costCard).toBeDefined();
    expect(costCard!.findAll("dt").map((node) => node.text())).toEqual([
      "Giá bạc hiện tại",
      "Tiền bạc (1,25 chỉ)",
      "Tiền công",
      "Tiền xi",
      "Chi phí khác",
      "Giá bán",
    ]);
    expect(costCard!.text()).toContain("220.000 VNĐ / chỉ");
    expect(costCard!.text()).toContain("275.000 ₫");
    expect(costCard!.text()).toContain("405.000 ₫");
    expect(wrapper.text()).not.toContain("Dữ liệu hệ thống");
    expect(wrapper.text()).not.toContain("Định danh và thời gian");
    expect(wrapper.text()).not.toContain("ID SKU");
    expect(wrapper.text()).not.toContain("ID hàng nhập kho");
    expect(
      wrapper
        .findAll('a[href="/products"]')
        .some((link) => link.text().includes("Danh sách")),
    ).toBe(true);
    expect(wrapper.find(`a[href="/warehoused-goods/${weightedSku.productId}"]`).exists())
      .toBe(false);
    expect(wrapper.text()).not.toContain("Xem hàng nhập kho");
    expect(wrapper.text()).not.toContain("Barcode");
    expect(wrapper.text()).not.toContain("10000000");
    expect(wrapper.text()).not.toContain("In tem");
    expect(wrapper.text()).not.toContain("Danh sách SKU");
    expect(wrapper.text()).toContain("Lịch sử SKU");
    expect(wrapper.text()).toContain("Ngọc Châu");
    expect(wrapper.text()).toContain("Tồn kho");
    expect(wrapper.text()).toContain("2 sản phẩm");
    expect(wrapper.text()).toContain("5 sản phẩm");
    expect(wrapper.text()).toContain("Giá bạc áp dụng");
    expect(wrapper.find('[data-testid*="edit"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid*="delete"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("shows only import price for piece-priced SKU cost composition", async () => {
    const pieceSku: ProductSku = {
      ...weightedSku,
      id: "sku-piece",
      barcode: "10000001",
      pricingType: "Đồ món",
      importPrice: 500_000,
      laborCost: 0,
      platingCost: 0,
    };
    const { wrapper } = await mountDetail(pieceSku);

    expect(wrapper.text()).toContain("Giá nhập");
    expect(wrapper.text()).toContain("500.000 ₫");
    expect(wrapper.text()).not.toContain("Tiền công");
    expect(wrapper.text()).not.toContain("Tiền xi");
    expect(wrapper.text()).not.toContain("Giá bạc hiện tại");
    expect(wrapper.text()).not.toContain("Tiền bạc");
    expect(wrapper.text()).not.toContain("Chi phí khác");
    expect(silverPriceService.status).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("hides other cost when weighted components equal the selling price", async () => {
    const { wrapper } = await mountDetail({
      ...weightedSku,
      id: "sku-exact-price",
      weight: 1,
      laborCost: 200_000,
      platingCost: 30_000,
      price: 450_000,
    });

    expect(wrapper.text()).toContain("Tiền bạc (1 chỉ)");
    expect(wrapper.text()).toContain("220.000 ₫");
    expect(wrapper.text()).not.toContain("Chi phí khác");
    wrapper.unmount();
  });

  it("hides other cost when the rounded selling price is below weighted components", async () => {
    const { wrapper } = await mountDetail({
      ...weightedSku,
      id: "sku-rounded-down",
      weight: 1,
      laborCost: 400_000,
      platingCost: 0,
      price: 600_000,
    });

    expect(wrapper.text()).toContain("Tiền bạc (1 chỉ)");
    expect(wrapper.text()).not.toContain("Chi phí khác");
    wrapper.unmount();
  });

  it("shows an unset fallback when the current silver price is not configured", async () => {
    const { wrapper } = await mountDetail(weightedSku, {
      ...silverPriceStatus,
      silverPrice: null,
    });

    expect(wrapper.text()).toContain("Giá bạc hiện tại");
    expect(wrapper.text()).toContain("Chưa thiết lập");
    expect(wrapper.text()).not.toContain("Tiền bạc");
    expect(wrapper.text()).not.toContain("Chi phí khác");
    wrapper.unmount();
  });

  it("keeps the SKU detail visible when the silver-price request fails", async () => {
    const { wrapper } = await mountDetail(
      weightedSku,
      new Error("Không tải được giá bạc"),
    );

    expect(wrapper.text()).toContain("Giá bạc hiện tại");
    expect(wrapper.text()).toContain("Không thể tải");
    expect(wrapper.text()).not.toContain("Tiền bạc");
    expect(wrapper.text()).not.toContain("Chi phí khác");
    expect(wrapper.text()).toContain(weightedSku.name);
    expect(wrapper.text()).toContain(weightedSku.skuCode);
    wrapper.unmount();
  });
});
