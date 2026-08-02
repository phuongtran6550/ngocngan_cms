import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import WarehouseDetailPage from "@/views/WarehousedGoods/detail.vue";
import { warehouseService } from "@/views/WarehousedGoods/service";
import type { WarehouseItem } from "@/views/WarehousedGoods/types";
import { authenStore } from "@/stores/app-authen";

const item: WarehouseItem = {
  id: "warehouse-1",
  code: "NC-001",
  name: "Nhẫn Aurora",
  supplier: { name: "Kim Hoàn Minh Anh", phone: "0909 123 456" },
  supplierName: "Kim Hoàn Minh Anh",
  supplierPhone: "0909 123 456",
  phone: "0909 123 456",
  thumbnail: "data:image/png;base64,AA==",
  images: [],
  categoryId: "category-1",
  category: "Nhẫn",
  materialId: "material-1",
  material: "Vàng 18K",
  patternId: "pattern-1",
  pattern: "Bông mai",
  pricingType: "Đồ món",
  skus: [
    {
      id: "sku-1",
      barcode: "100000000001",
      code: "NH-V18K-BM-1P25C-N12",
      size: "12",
      weight: 1.25,
      price: 850_000,
      laborCost: 0,
      platingCost: 0,
      importPrice: 500_000,
      stock: 6,
    },
    {
      id: "sku-2",
      barcode: "100000000002",
      code: "NH-V18K-BM-1P4C-N14",
      size: "14",
      weight: 1.4,
      price: 1_100_000,
      laborCost: 0,
      platingCost: 0,
      importPrice: 650_000,
      stock: 8,
    },
  ],
  price: 850_000,
  laborCost: 0,
  platingCost: 0,
  importPrice: 500_000,
  weight: 1.25,
  size: "12",
  stock: 14,
  sold: 1,
  pending: 1,
  status: "active",
  createdBy: { id: "user-1", name: "Ngọc Châu" },
  updatedAt: "2026-07-26T07:30:00.000Z",
};

describe("WarehouseDetailPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    vi.spyOn(warehouseService, "detail").mockResolvedValue(item);
  });

  afterEach(() => vi.restoreAllMocks());

  it("uses a div for the page layout container", () => {
    const wrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: {} },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });

    expect(wrapper.element.tagName).toBe("DIV");
  });

  it("shows the add-new action only after redirecting from creation", async () => {
    const createdWrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: { created: "1" } },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    const regularWrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: {} },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    expect(
      createdWrapper
        .get('[data-testid="create-another-product"]')
        .attributes("to"),
    ).toBe("/warehoused-goods/create");
    expect(
      regularWrapper.find('[data-testid="create-another-product"]').exists(),
    ).toBe(false);
  });

  it("routes updates to the full-page shared warehouse form", async () => {
    const wrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: {} },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    expect(
      wrapper.get('[data-testid="edit-warehouse-product"]').attributes("to"),
    ).toBe(`/warehoused-goods/${item.id}/edit`);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("renders the approved product overview, SKU ranges and responsive SKU layouts", async () => {
    const wrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: {} },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    expect(wrapper.get('[data-testid="product-price-range"]').text()).toBe(
      "850.000 ₫ – 1.100.000 ₫",
    );
    expect(wrapper.get('[data-testid="product-weight-range"]').text()).toBe(
      "1,25 – 1,4 chỉ",
    );
    expect(wrapper.get('[data-testid="product-size-range"]').text()).toBe(
      "Ni 12 – 14",
    );
    expect(wrapper.get('[data-testid="product-total-stock"]').text()).toContain(
      "14",
    );
    expect(wrapper.findAll('[data-testid="desktop-sku-row"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-testid="mobile-sku-card"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-testid="print-sku-label"]')).toHaveLength(4);
    expect(
      wrapper
        .findAllComponents({ name: "RouterLink" })
        .filter((link) => link.attributes("to") === "/products/sku-1#history"),
    ).toHaveLength(2);
    expect(
      wrapper.get('[data-testid="sku-actions-heading"]').classes(),
    ).toContain("position-relative");
    expect(wrapper.text()).toContain("GoDEX G500");
    expect(wrapper.find("section").exists()).toBe(false);
  });

  it("opens a quantity modal and submits one batch print request", async () => {
    vi.spyOn(warehouseService, "printLabel").mockResolvedValue({
      queued: true,
      printer: "Godex_G500",
      jobId: "Godex_G500-25",
      quantity: 6,
    });
    const wrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: {} },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    await wrapper.findAll('[data-testid="print-sku-label"]')[0].trigger("click");
    await flushPromises();

    const dialog = wrapper.get('[data-testid="print-label-dialog"]');
    expect(dialog.text()).toContain("NH-V18K-BM-1P25C-N12");
    await dialog.get('input[name="printQuantity"]').setValue("6");
    await dialog.get("form").trigger("submit");
    await flushPromises();

    expect(warehouseService.printLabel).toHaveBeenCalledWith(
      item.id,
      "sku-1",
      6,
    );
    expect(wrapper.find('[data-testid="print-label-dialog"]').exists()).toBe(
      false,
    );
    expect(wrapper.get('[data-testid="print-label-success"]').text()).toContain(
      "Đã gửi 6 tem SKU NH-V18K-BM-1P25C-N12",
    );
  });

  it("shows invalid quantity below the modal input without sending a request", async () => {
    const printLabel = vi.spyOn(warehouseService, "printLabel");
    const wrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: {} },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    await wrapper.findAll('[data-testid="print-sku-label"]')[0].trigger("click");
    const input = wrapper.get('input[name="printQuantity"]');
    await input.setValue("0");
    await wrapper.get('[data-testid="print-label-dialog"] form').trigger("submit");
    await flushPromises();

    expect(wrapper.get("#print-label-quantity-error").text()).toContain(
      "Số lượng tem phải là số nguyên từ 1 đến 100",
    );
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(printLabel).not.toHaveBeenCalled();
  });

  it("uses the shared money and datetime presentation", async () => {
    const wrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: {} },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    const expectedDate = new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(item.updatedAt as string));
    expect(wrapper.text()).toContain(`Cập nhật ${expectedDate}`);
    expect(wrapper.text()).toContain("500.000 ₫");
  });

  it("shows only the product fields requested for the warehouse workflow", async () => {
    const wrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: {} },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain("Danh mục");
    expect(text).toContain("Chất liệu");
    expect(text).toContain("Mẫu");
    expect(text).toContain("Loại sản phẩm");
    expect(text).not.toContain("Nguồn hàng");
    expect(text).not.toContain("Số điện thoại");
    expect(text).not.toContain("Trạng thái");
    expect(text).not.toContain(item.supplierName);
    expect(text).not.toContain(item.supplierPhone);
  });

  it("shows persisted codes for every SKU row", async () => {
    const wrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: {} },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("NH-V18K-BM-1P25C-N12");
    expect(wrapper.text()).toContain("NH-V18K-BM-1P4C-N14");
    expect(wrapper.get('[data-testid="sku-stock-0"]').text()).toBe("6");
    expect(wrapper.get('[data-testid="sku-stock-1"]').text()).toBe("8");
    expect(wrapper.text()).not.toContain("#1");
  });

  it("shows labor and plating costs instead of import price for weighted products", async () => {
    vi.mocked(warehouseService.detail).mockResolvedValueOnce({
      ...item,
      pricingType: "Đồ cân",
      skus: item.skus.map((sku, index) => ({
        ...sku,
        laborCost: index === 0 ? 50_000 : 70_000,
        platingCost: index === 0 ? 10_000 : 20_000,
        importPrice: null,
      })),
    });
    const wrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: {} },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Tiền công");
    expect(wrapper.text()).toContain("Tiền xi");
    expect(wrapper.text()).not.toContain("Giá nhập");
    expect(wrapper.text()).toContain("50.000 ₫");
    expect(wrapper.text()).toContain("20.000 ₫");
  });

  it("shows the update confirmation after returning from the edit page", async () => {
    const wrapper = mount(WarehouseDetailPage, {
      global: {
        mocks: {
          $route: { params: { id: item.id }, query: { updated: "1" } },
          $router: { replace: vi.fn() },
        },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    expect(wrapper.get('[role="status"]').text()).toContain(
      "Đã cập nhật hàng nhập kho",
    );
  });
});
