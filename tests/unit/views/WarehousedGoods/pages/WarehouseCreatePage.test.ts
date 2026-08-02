import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import WarehouseCreateForm from "@/views/WarehousedGoods/components/WarehouseCreateForm.vue";
import WarehouseCreatePage from "@/views/WarehousedGoods/add.vue";
import { warehouseService } from "@/views/WarehousedGoods/service";
import { emptyWarehouseForm } from "@/views/WarehousedGoods/types";

const options = {
  categories: [{ id: "category-1", name: "Nhẫn", type: "category" as const }],
  materials: [{ id: "material-1", name: "Bạc 925", type: "material" as const }],
  patterns: [{ id: "pattern-1", name: "Bông mai", type: "pattern" as const }],
  silverPrice: 220_000,
};

describe("WarehouseCreatePage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(warehouseService, "options").mockRejectedValue({
      message: "Không thể tải danh mục kho",
      code: "OPTIONS_UNAVAILABLE",
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("uses a div for the page layout container", () => {
    const wrapper = mount(WarehouseCreatePage, {
      global: {
        mocks: { $router: { replace: vi.fn() } },
        stubs: { RouterLink: true },
      },
    });

    expect(wrapper.element.tagName).toBe("DIV");
  });

  it("shows option loading failures instead of leaving an empty form unexplained", async () => {
    const wrapper = mount(WarehouseCreatePage, {
      global: {
        mocks: { $router: { replace: vi.fn() } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toContain(
      "Không thể tải danh mục kho",
    );
  });

  it("passes normalized API validation errors to the exact form fields", async () => {
    vi.mocked(warehouseService.options).mockResolvedValue(options);
    vi.spyOn(warehouseService, "create").mockRejectedValue({
      message: "Dữ liệu sản phẩm chưa hợp lệ",
      code: "VALIDATION_ERROR",
      errors: {
        "skus.1.weight": "SKU 2: Trọng lượng chỉ phải lớn hơn 0",
      },
    });
    const wrapper = mount(WarehouseCreatePage, {
      global: {
        mocks: { $router: { replace: vi.fn() } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    wrapper
      .findComponent(WarehouseCreateForm)
      .vm.$emit("submit", emptyWarehouseForm());
    await flushPromises();

    expect(
      wrapper.findComponent(WarehouseCreateForm).props("fieldErrors"),
    ).toEqual({
      "skus.1.weight": "SKU 2: Trọng lượng chỉ phải lớn hơn 0",
    });
  });

  it("renders and focuses the exact SKU input after an API rejection", async () => {
    vi.mocked(warehouseService.options).mockResolvedValue(options);
    vi.spyOn(warehouseService, "create").mockRejectedValue({
      message: "SKU 1: Giá bán không hợp lệ",
      code: "INVALID_INVENTORY_SKUS",
      errors: {
        "skus.0.price": "SKU 1: Giá bán không hợp lệ",
      },
    });
    const wrapper = mount(WarehouseCreatePage, {
      attachTo: document.body,
      global: {
        mocks: { $router: { replace: vi.fn() } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    wrapper
      .findComponent(WarehouseCreateForm)
      .vm.$emit("submit", emptyWarehouseForm());
    await flushPromises();

    const input = wrapper.get<HTMLInputElement>('input[name="skus[0].price"]');
    expect(input.classes()).toContain("is-invalid");
    expect(wrapper.get("#warehouse-error-skus-0-price").text()).toContain(
      "Giá bán không hợp lệ",
    );
    expect(document.activeElement).toBe(input.element);

    wrapper.unmount();
  });

  it("maps upload validation codes to the image input", async () => {
    vi.mocked(warehouseService.options).mockResolvedValue(options);
    vi.spyOn(warehouseService, "create").mockRejectedValue({
      message: "Nội dung tệp không phải hình ảnh hợp lệ",
      code: "INVALID_IMAGE_CONTENT",
    });
    const wrapper = mount(WarehouseCreatePage, {
      global: {
        mocks: { $router: { replace: vi.fn() } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    wrapper
      .findComponent(WarehouseCreateForm)
      .vm.$emit("submit", emptyWarehouseForm());
    await flushPromises();

    expect(
      wrapper.findComponent(WarehouseCreateForm).props("fieldErrors"),
    ).toEqual({
      thumbnail: "Nội dung tệp không phải hình ảnh hợp lệ",
    });
  });
});
