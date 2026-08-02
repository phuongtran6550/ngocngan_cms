import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import WarehouseListPage from "@/views/WarehousedGoods/index.vue";
import { warehouseService } from "@/views/WarehousedGoods/service";
import { authenStore } from "@/stores/app-authen";
import type { WarehouseItem } from "@/views/WarehousedGoods/types";

const product: WarehouseItem = {
  id: "product-1",
  code: "NH-V18K-TR",
  name: "Nhẫn Aurora",
  supplier: { name: "", phone: "" },
  supplierName: "",
  supplierPhone: "",
  phone: "",
  thumbnail: "/uploads/aurora.jpg",
  images: [],
  categoryId: "category-1",
  category: "Nhẫn",
  materialId: "material-1",
  material: "Vàng 18K",
  patternId: "pattern-1",
  pattern: "Trơn",
  pricingType: "Đồ món",
  skus: [],
  price: 850_000,
  laborCost: 0,
  platingCost: 0,
  importPrice: 500_000,
  weight: 1.25,
  size: "12",
  stock: 8,
  sold: 0,
  pending: 0,
  status: "active",
  updatedAt: "2026-08-01T10:00:00.000Z",
};

describe("WarehouseListPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    vi.spyOn(warehouseService, "list").mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
    vi.spyOn(warehouseService, "options").mockResolvedValue({
      categories: [],
      materials: [],
      patterns: [],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("uses the route query before the first inventory request", async () => {
    mount(WarehouseListPage, {
      global: {
        mocks: {
          $route: { query: { query: " 0909 123 456 " } },
          $router: { push: vi.fn() },
        },
      },
    });
    await flushPromises();

    expect(warehouseService.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, query: "0909 123 456" }),
      expect.any(AbortSignal),
    );
  });

  it("does not expose supplier or status fields that are outside the requested workflow", async () => {
    const wrapper = mount(WarehouseListPage, {
      global: {
        mocks: {
          $route: { query: {} },
          $router: { push: vi.fn() },
        },
      },
    });
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      effectiveDefinition: { columns: Array<{ key: string }> };
    };
    expect(
      vm.effectiveDefinition.columns.map((column) => column.key),
    ).not.toEqual(expect.arrayContaining(["supplierName", "status"]));
    expect(wrapper.find("#warehouse-status-filter").exists()).toBe(false);
  });

  it("uses the approved Phoenix product columns and compact toolbar", async () => {
    const wrapper = mount(WarehouseListPage, {
      global: {
        mocks: {
          $route: { query: {} },
          $router: { push: vi.fn() },
        },
      },
    });
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      effectiveDefinition: {
        key: string;
        tableMinWidth?: string;
        columns: Array<{ key: string }>;
        actions: { create?: boolean };
      };
    };
    expect(vm.effectiveDefinition.key).toBe("warehoused-goods");
    expect(vm.effectiveDefinition.tableMinWidth).toBe("70rem");
    expect(vm.effectiveDefinition.columns.map((column) => column.key)).toEqual([
      "name",
      "price",
      "category",
      "classificationTags",
      "pricingType",
      "stock",
      "updatedAt",
    ]);
    expect(vm.effectiveDefinition.actions.create).toBe(false);
    expect(wrapper.get('input[type="search"]').attributes("placeholder")).toBe(
      "Tìm kiếm sản phẩm",
    );
    expect(wrapper.get('[data-testid="product-list-create"]').text()).toContain(
      "Thêm sản phẩm",
    );
    expect(wrapper.find('[data-testid="list-create"]').exists()).toBe(false);
  });

  it("maps material and pattern into one reusable classification cell", async () => {
    vi.mocked(warehouseService.list).mockResolvedValueOnce({
      items: [product],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    const wrapper = mount(WarehouseListPage, {
      global: {
        mocks: {
          $route: { query: {} },
          $router: { push: vi.fn() },
        },
      },
    });
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      rows: Array<{ classificationTags: string[] }>;
    };
    expect(vm.rows[0].classificationTags).toEqual(["Vàng 18K", "Trơn"]);
    expect(wrapper.text()).toContain("Nhẫn Aurora");
    expect(wrapper.text()).toContain("NH-V18K-TR");
  });
});
