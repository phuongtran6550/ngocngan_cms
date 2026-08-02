import { DOMWrapper, flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { vi } from "vitest";
import ProductListPage from "@/views/Products/index.vue";
import { productService } from "@/views/Products/service";
import { useProductStore } from "@/views/Products/store";
import type { ProductSku } from "@/views/Products/types";

const sku: ProductSku = {
  id: "sku-1",
  productId: "warehouse-1",
  barcode: "10000000",
  skuCode: "NH-B925-BM-1C-N12",
  name: "Nhẫn Bông mai",
  thumbnail: "/uploads/product.jpg",
  images: [],
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
  updatedAt: "2026-08-02T08:00:00.000Z",
};

async function mountPage(initialPath = "/products") {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/products", component: { template: "<div />" } },
      { path: "/products/:skuId", component: { template: "<div />" } },
    ],
  });
  await router.push(initialPath);
  await router.isReady();
  const wrapper = mount(ProductListPage, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router],
      stubs: {
        ProductBarcodeScanner: {
          template: '<div data-testid="scanner-stub" />',
        },
      },
    },
  });
  await flushPromises();
  return { wrapper, router };
}

describe("ProductListPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(productService, "list").mockResolvedValue({
      items: [sku],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    vi.spyOn(productService, "options").mockResolvedValue({
      categories: [{ id: "category-1", name: "Nhẫn", type: "category" }],
      materials: [{ id: "material-1", name: "Bạc 925", type: "material" }],
      patterns: [{ id: "pattern-1", name: "Bông mai", type: "pattern" }],
    });
  });

  afterEach(() => {
    document.body.classList.remove("modal-open");
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders the Product list breadcrumb", async () => {
    const { wrapper } = await mountPage();

    const breadcrumb = wrapper.get('nav[aria-label="breadcrumb"]');
    expect(breadcrumb.text()).toContain("Trang chủ");
    expect(breadcrumb.text()).toContain("Sản phẩm");
    expect(breadcrumb.get('a[href="/"]').text()).toBe("Trang chủ");
    wrapper.unmount();
  });

  it("renders the read-only per-SKU list with header-driven search and three filters", async () => {
    const { wrapper } = await mountPage("/products?query=NH-B925");
    const vm = wrapper.vm as never as {
      rows: Array<Record<string, unknown>>;
      productDefinition: {
        columns: Array<{ key: string }>;
        actions: Record<string, boolean>;
      };
    };

    expect(wrapper.find(".product-quick-search").exists()).toBe(false);
    expect(wrapper.find('input[type="search"]').exists()).toBe(false);
    expect(productService.list).toHaveBeenCalledWith(
      expect.objectContaining({ query: "NH-B925" }),
      expect.any(AbortSignal),
    );
    const titleRow = wrapper
      .findAll(".row")
      .find((row) => row.find("h2").text() === "Sản phẩm");
    expect(titleRow?.text()).toContain("Quét mã");
    expect(titleRow?.text()).toContain("Bộ lọc");

    const scanActionButton = wrapper.get('button[aria-label="Quét mã"]');
    const filterActionButton = wrapper.get('button[aria-label="Bộ lọc"]');
    expect(scanActionButton.attributes("title")).toBe("Quét mã");
    expect(filterActionButton.attributes("title")).toBe("Bộ lọc");
    expect(scanActionButton.get(".product-action-label").classes()).toEqual(
      expect.arrayContaining(["d-none", "d-sm-inline"]),
    );
    expect(filterActionButton.get(".product-action-label").classes()).toEqual(
      expect.arrayContaining(["d-none", "d-sm-inline"]),
    );

    useProductStore().categoryId = "category-1";
    await wrapper.vm.$nextTick();
    expect(wrapper.get(".product-filter-count").classes()).toEqual(
      expect.arrayContaining(["d-none", "d-sm-inline"]),
    );

    const listToolbar = wrapper.get("#products > .mb-3 > .d-flex");
    expect(listToolbar.find('[data-testid="view-mode-toggle"]').exists()).toBe(true);
    expect(listToolbar.text()).not.toContain("Quét mã");
    expect(listToolbar.text()).not.toContain("Bộ lọc");
    expect(vm.productDefinition.columns.map((column) => column.key)).toEqual([
      "name",
      "price",
      "stock",
      "weight",
      "size",
      "classificationTags",
      "updatedAt",
    ]);
    expect(vm.productDefinition.actions).toMatchObject({
      create: false,
      update: false,
      delete: false,
    });
    expect(vm.rows[0]).toMatchObject({
      id: "sku-1",
      price: 850_000,
      stock: 2,
      weight: "1,25 chỉ",
      size: "Ni 12",
      classificationTags: ["Nhẫn", "Bạc 925", "Bông mai"],
    });
    expect(wrapper.find('[data-testid="list-create"]').exists()).toBe(false);
    expect(document.body.querySelector('[data-testid="row-action-edit"]')).toBeNull();
    expect(document.body.querySelector('[data-testid="row-action-delete"]')).toBeNull();

    await filterActionButton.trigger("click");
    expect(document.body.querySelectorAll("#product-category-filter, #product-material-filter, #product-pattern-filter"))
      .toHaveLength(3);
    wrapper.unmount();
  });

  it("navigates the view-only row action to the exact SKU detail", async () => {
    const { wrapper, router } = await mountPage();

    await wrapper.get('[data-testid="row-action-toggle"]').trigger("click");
    const viewAction = document.body.querySelector<HTMLElement>(
      '[data-testid="row-action-view"]',
    );
    expect(viewAction).not.toBeNull();
    if (viewAction) await new DOMWrapper(viewAction).trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe("/products/sku-1");
    wrapper.unmount();
  });

  it("does not apply draft classification filters when the drawer is closed", async () => {
    const { wrapper } = await mountPage();
    const filterButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("Bộ lọc"));
    await filterButton?.trigger("click");
    const category = document.body.querySelector<HTMLSelectElement>(
      "#product-category-filter",
    );
    expect(category).not.toBeNull();
    if (category) {
      category.value = "category-1";
      category.dispatchEvent(new Event("change", { bubbles: true }));
    }
    document.body
      .querySelector<HTMLButtonElement>(".offcanvas .btn-close")
      ?.click();
    await flushPromises();

    expect(useProductStore().categoryId).toBe("");
    expect(productService.list).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
});
