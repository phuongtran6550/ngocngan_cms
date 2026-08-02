import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { assetUrl } from "@/request";
import WarehouseCreateForm from "@/views/WarehousedGoods/components/WarehouseCreateForm.vue";
import WarehouseEditPage from "@/views/WarehousedGoods/edit.vue";
import { warehouseService } from "@/views/WarehousedGoods/service";
import type {
  WarehouseFormModel,
  WarehouseItem,
} from "@/views/WarehousedGoods/types";

const options = {
  categories: [{ id: "category-1", name: "Nhẫn", type: "category" as const }],
  materials: [{ id: "material-1", name: "Bạc 925", type: "material" as const }],
  patterns: [{ id: "pattern-1", name: "Bông mai", type: "pattern" as const }],
  silverPrice: 220_000,
};

const item: WarehouseItem = {
  id: "warehouse-1",
  code: "NH-B925-BM-1P25C-N12",
  name: "Nhẫn Solis",
  supplier: { name: "", phone: "" },
  supplierName: "",
  supplierPhone: "",
  phone: "",
  thumbnail: "/uploads/warehouse.jpg",
  images: ["/uploads/warehouse.jpg"],
  categoryId: "category-1",
  category: "Nhẫn",
  materialId: "material-1",
  material: "Bạc 925",
  patternId: "pattern-1",
  pattern: "Bông mai",
  pricingType: "Đồ món",
  skus: [
    {
      id: "sku-1",
      code: "NH-B925-BM-1P25C-N12",
      size: "Ni 12",
      weight: 1.25,
      price: 6_700_000,
      laborCost: 0,
      platingCost: 0,
      importPrice: 4_200_000,
      stock: 3,
    },
    {
      id: "sku-2",
      code: "NH-B925-BM-1P4C-N14",
      size: "Ni 14",
      weight: 1.4,
      price: 650_000,
      laborCost: 0,
      platingCost: 0,
      importPrice: 350_000,
      stock: 7,
    },
  ],
  price: 6_700_000,
  laborCost: 0,
  platingCost: 0,
  importPrice: 4_200_000,
  weight: 1.25,
  size: "Ni 12",
  stock: 10,
  sold: 0,
  pending: 0,
  status: "active",
};

function mountPage() {
  return mount(WarehouseEditPage, {
    global: {
      mocks: {
        $route: { params: { id: item.id } },
        $router: { replace: vi.fn() },
      },
      stubs: { RouterLink: true },
    },
  });
}

describe("WarehouseEditPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(warehouseService, "detail").mockResolvedValue(item);
    vi.spyOn(warehouseService, "options").mockResolvedValue(options);
    vi.spyOn(warehouseService, "update").mockResolvedValue(item);
  });

  afterEach(() => vi.restoreAllMocks());

  it("hydrates the shared create form with the existing image and every SKU", async () => {
    const wrapper = mountPage();
    await flushPromises();

    const form = wrapper.getComponent(WarehouseCreateForm);
    const value = form.props("modelValue") as WarehouseFormModel;

    expect(form.props("formId")).toBe("warehouse-edit-form");
    expect(form.props("existingThumbnail")).toBe(assetUrl(item.thumbnail));
    expect(value.name).toBe(item.name);
    expect(value).not.toHaveProperty("supplierName");
    expect(value).not.toHaveProperty("supplierPhone");
    expect(value).not.toHaveProperty("status");
    expect(value).not.toHaveProperty("sold");
    expect(value).not.toHaveProperty("pending");
    expect(value.skus).toHaveLength(2);
    expect(value.skus.map((sku) => sku.code)).toEqual([
      "NH-B925-BM-1P25C-N12",
      "NH-B925-BM-1P4C-N14",
    ]);
    expect(value.skus.map((sku) => sku.stock)).toEqual([3, 7]);
  });

  it("patches the product and returns to its detail page", async () => {
    const wrapper = mountPage();
    await flushPromises();
    const submitted = wrapper
      .getComponent(WarehouseCreateForm)
      .props("modelValue") as WarehouseFormModel;

    wrapper.getComponent(WarehouseCreateForm).vm.$emit("submit", submitted);
    await flushPromises();

    expect(warehouseService.update).toHaveBeenCalledWith(item.id, submitted);
    expect(wrapper.vm.$router.replace).toHaveBeenCalledWith({
      path: `/warehoused-goods/${item.id}`,
      query: { updated: "1" },
    });
  });

  it("passes API validation to the exact shared-form field", async () => {
    vi.mocked(warehouseService.update).mockRejectedValueOnce({
      message: "Dữ liệu sản phẩm chưa hợp lệ",
      code: "VALIDATION_ERROR",
      errors: {
        "skus.1.stock": "SKU 2: Tồn kho phải là số nguyên không âm",
      },
    });
    const wrapper = mountPage();
    await flushPromises();
    const form = wrapper.getComponent(WarehouseCreateForm);

    form.vm.$emit("submit", form.props("modelValue"));
    await flushPromises();

    expect(form.props("fieldErrors")).toEqual({
      "skus.1.stock": "SKU 2: Tồn kho phải là số nguyên không âm",
    });
  });

  it("requires legacy products to choose one of the two supported product types", async () => {
    vi.mocked(warehouseService.detail).mockResolvedValueOnce({
      ...item,
      pricingType: "Đồ hột",
    });
    const wrapper = mountPage();
    await flushPromises();

    const value = wrapper
      .getComponent(WarehouseCreateForm)
      .props("modelValue") as WarehouseFormModel;
    expect(value.pricingType).toBe("");
  });
});
