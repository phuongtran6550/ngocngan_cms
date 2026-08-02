import { flushPromises, mount } from "@vue/test-utils";
import { vi } from "vitest";
import WarehouseCreateForm from "@/views/WarehousedGoods/components/WarehouseCreateForm.vue";
import { warehouseService } from "@/views/WarehousedGoods/service";
import {
  emptyWarehouseForm,
  type WarehouseFormModel,
} from "@/views/WarehousedGoods/types";

const options = {
  categories: [{ id: "category-1", name: "Nhẫn", type: "category" as const }],
  materials: [{ id: "material-1", name: "Bạc 925", type: "material" as const }],
  patterns: [
    { id: "pattern-1", name: "Bông mai", type: "pattern" as const },
    { id: "pattern-2", name: "Trơn", type: "pattern" as const },
  ],
  silverPrice: 220_000,
};

function mountForm() {
  return mount(WarehouseCreateForm, {
    props: { modelValue: emptyWarehouseForm(), options },
    global: { stubs: { RouterLink: true } },
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function selectSkuCatalog(wrapper: ReturnType<typeof mountForm>) {
  await wrapper.get('select[name="categoryId"]').setValue("category-1");
  await wrapper.get('select[name="materialId"]').setValue("material-1");
  await wrapper.get('select[name="patternId"]').setValue("pattern-1");
}

describe("WarehouseCreateForm", () => {
  beforeEach(() => {
    vi.spyOn(warehouseService, "checkSkuCodes").mockImplementation(
      async (skus) => ({
        items: skus.map((sku) => ({
          code: sku.code,
        })),
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses explicit div blocks for every main form area", () => {
    const wrapper = mountForm();

    expect(wrapper.find(".warehouse-main").exists()).toBe(false);
    for (const selector of [
      ".warehouse-name-field",
      ".warehouse-image-section",
      ".sku-section",
    ]) {
      expect(wrapper.get(selector).element.tagName).toBe("DIV");
    }
    expect(wrapper.findAll(".warehouse-create-layout > section")).toHaveLength(
      0,
    );
  });

  it("keeps SKU measurements roomy and starts stock on the next grid row", () => {
    const wrapper = mountForm();
    const fieldColumn = (name: string) =>
      wrapper.get(`input[name="${name}"]`).element.closest(".col-12");

    expect(fieldColumn("skus[0].size")?.classList).toContain("col-sm-6");
    expect(fieldColumn("skus[0].weight")?.classList).toContain("col-sm-6");
    expect(fieldColumn("skus[0].stock")?.classList).toContain("col-sm-6");
    expect(wrapper.findAll('[data-testid="sku-card"] section')).toHaveLength(0);
  });

  it("shows the requested catalog comboboxes", () => {
    const wrapper = mountForm();

    expect(wrapper.get('select[name="categoryId"]').text()).toContain("Nhẫn");
    expect(wrapper.get('select[name="materialId"]').text()).toContain(
      "Bạc 925",
    );
    expect(wrapper.get('select[name="patternId"]').text()).toContain(
      "Bông mai",
    );
  });

  it("reuses the form for editing with the persisted image", async () => {
    const form = emptyWarehouseForm();
    form.name = "Nhẫn đang lưu kho";
    form.categoryId = "category-1";
    form.materialId = "material-1";
    form.patternId = "pattern-1";
    form.pricingType = "Đồ món";
    form.skus[0] = {
      ...form.skus[0],
      code: "NH-B925-BM-1C-N12",
      codeMode: "manual",
      size: "Ni 12",
      weight: 1,
      importPrice: 350_000,
      price: 650_000,
      stock: 3,
    };
    const wrapper = mount(WarehouseCreateForm, {
      props: {
        modelValue: form,
        options,
        formId: "warehouse-edit-form",
        existingThumbnail: "/uploads/warehouse.jpg",
      } as never,
      global: { stubs: { RouterLink: true } },
    });

    expect(wrapper.get("form").attributes("id")).toBe("warehouse-edit-form");
    expect(wrapper.findComponent({ name: "ImageUploader" }).props("src")).toBe(
      "/uploads/warehouse.jpg",
    );

    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.emitted("submit")).toHaveLength(1);
  });

  it("does not reallocate an unchanged persisted SKU code during editing", async () => {
    const form = emptyWarehouseForm();
    form.name = "Nhẫn đang lưu kho";
    form.categoryId = "category-1";
    form.materialId = "material-1";
    form.patternId = "pattern-1";
    form.pricingType = "Đồ món";
    form.skus[0] = {
      ...form.skus[0],
      id: "sku-1",
      code: "NH-B925-BM-1C-N12",
      codeMode: "manual",
      codeSource: "NH-B925-BM-1C-N12",
      size: "Ni 12",
      weight: 1,
      importPrice: 350_000,
      price: 650_000,
      stock: 3,
    };
    const wrapper = mount(WarehouseCreateForm, {
      props: {
        modelValue: form,
        options,
        formId: "warehouse-edit-form",
        existingThumbnail: "/uploads/warehouse.jpg",
      } as never,
      global: { stubs: { RouterLink: true } },
    });

    vi.mocked(warehouseService.checkSkuCodes).mockClear();
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(warehouseService.checkSkuCodes).not.toHaveBeenCalled();
    const submitted = wrapper.emitted("submit")?.[0]?.[0] as WarehouseFormModel;
    expect(submitted.skus[0].code).toBe("NH-B925-BM-1C-N12");
  });

  it("checks a persisted SKU again after its code changes", async () => {
    const form = emptyWarehouseForm();
    form.categoryId = "category-1";
    form.materialId = "material-1";
    form.patternId = "pattern-1";
    form.pricingType = "Đồ món";
    form.skus[0] = {
      ...form.skus[0],
      id: "sku-1",
      code: "NH-B925-BM-1C-N12",
      codeMode: "manual",
      codeSource: "NH-B925-BM-1C-N12",
      size: "Ni 12",
      weight: 1,
      importPrice: 350_000,
      price: 650_000,
      stock: 3,
    };
    const wrapper = mount(WarehouseCreateForm, {
      props: { modelValue: form, options } as never,
      global: { stubs: { RouterLink: true } },
    });

    vi.mocked(warehouseService.checkSkuCodes).mockClear();
    await wrapper
      .get('input[name="skus[0].code"]')
      .setValue("NH-B925-BM-1C-N14");
    await wrapper.get('input[name="skus[0].code"]').trigger("blur");
    await flushPromises();

    expect(warehouseService.checkSkuCodes).toHaveBeenCalledWith(
      [{ code: "NH-B925-BM-1C-N14" }],
      expect.any(AbortSignal),
    );
  });

  it("generates a readable code and shows it in the pricing card", async () => {
    const wrapper = mountForm();

    await selectSkuCatalog(wrapper);
    await wrapper.get('input[name="skus[0].size"]').setValue("Ni 12");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1.5");

    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].code"]').element.value,
    ).toBe("NH-B925-BM-1P5C-N12");
    expect(wrapper.get('[data-testid="pricing-sku-code-0"]').text()).toBe(
      "NH-B925-BM-1P5C-N12",
    );
  });

  it("requests a usable SKU code only after leaving a source field", async () => {
    vi.useFakeTimers();
    const wrapper = mountForm();

    await selectSkuCatalog(wrapper);
    await wrapper.get('input[name="skus[0].size"]').setValue("Ni 12");
    const weightInput = wrapper.get('input[name="skus[0].weight"]');
    await weightInput.setValue("1.5");
    await vi.advanceTimersByTimeAsync(500);

    expect(warehouseService.checkSkuCodes).not.toHaveBeenCalled();

    await weightInput.trigger("blur");
    await flushPromises();

    expect(warehouseService.checkSkuCodes).toHaveBeenCalledTimes(1);
  });

  it("keeps an untouched automatic SKU automatic after its input blurs", async () => {
    const wrapper = mountForm();

    await selectSkuCatalog(wrapper);
    await wrapper.get('input[name="skus[0].weight"]').setValue("1.5");
    vi.mocked(warehouseService.checkSkuCodes).mockClear();

    await wrapper.get('input[name="skus[0].code"]').trigger("blur");
    await flushPromises();

    expect(warehouseService.checkSkuCodes).toHaveBeenCalledTimes(1);

    await wrapper.get('select[name="patternId"]').setValue("pattern-2");
    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].code"]').element.value,
    ).toBe("NH-B925-TR-1P5C");
  });

  it("adds suffixes to identical automatic SKU codes", async () => {
    const wrapper = mountForm();

    await selectSkuCatalog(wrapper);
    await wrapper.get('input[name="skus[0].size"]').setValue("Ni 12");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1.5");
    await wrapper.get('[data-testid="add-sku"]').trigger("click");
    await wrapper.get('input[name="skus[1].size"]').setValue("Ni 12");
    await wrapper.get('input[name="skus[1].weight"]').setValue("1.5");

    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[1].code"]').element.value,
    ).toBe("NH-B925-BM-1P5C-N12-02");
  });

  it("protects a manual code and can regenerate it explicitly", async () => {
    const wrapper = mountForm();

    await selectSkuCatalog(wrapper);
    await wrapper.get('input[name="skus[0].size"]').setValue("Ni 12");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1.5");
    await wrapper.get('input[name="skus[0].code"]').setValue("ma tuy chinh");
    await wrapper.get('input[name="skus[0].code"]').trigger("blur");
    await wrapper.get('select[name="patternId"]').setValue("pattern-2");

    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].code"]').element.value,
    ).toBe("MA-TUY-CHINH");

    vi.mocked(warehouseService.checkSkuCodes).mockClear();
    await wrapper.get('button[aria-label="Tạo lại mã SKU 1"]').trigger("click");
    await flushPromises();

    expect(warehouseService.checkSkuCodes).toHaveBeenCalledTimes(1);
    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].code"]').element.value,
    ).toBe("NH-B925-TR-1P5C-N12");
  });

  it("uses the available API code without rendering availability status", async () => {
    vi.mocked(warehouseService.checkSkuCodes).mockImplementation(
      async (skus) => ({
        items: skus.map((sku) => ({
          code: `${sku.code}-03`,
        })),
      }),
    );
    const wrapper = mountForm();

    await selectSkuCatalog(wrapper);
    await wrapper.get('input[name="skus[0].size"]').setValue("Ni 12");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1.5");
    await (
      wrapper.vm as unknown as { checkSkuCodesNow(): Promise<boolean> }
    ).checkSkuCodesNow();
    await flushPromises();

    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].code"]').element.value,
    ).toBe("NH-B925-BM-1P5C-N12-03");
    expect(wrapper.find('[data-testid="sku-code-status-0"]').exists()).toBe(
      false,
    );
    expect(wrapper.get('[data-testid="pricing-sku-code-0"]').text()).toBe(
      "NH-B925-BM-1P5C-N12-03",
    );
  });

  it("replaces a duplicate manual code with the available API code", async () => {
    vi.mocked(warehouseService.checkSkuCodes).mockImplementation(
      async (skus) => ({
        items: skus.map((sku) => ({
          code: sku.code === "CUSTOM-N14" ? "CUSTOM-N14-02" : sku.code,
        })),
      }),
    );
    const wrapper = mountForm();
    const image = new File(["image"], "item.jpg", { type: "image/jpeg" });

    await wrapper.get('input[name="name"]').setValue("Nhẫn mã riêng");
    await selectSkuCatalog(wrapper);
    await wrapper.get('select[name="pricingType"]').setValue("Đồ món");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1");
    await wrapper.get('input[name="skus[0].importPrice"]').setValue("350000");
    await wrapper.get('input[name="skus[0].code"]').setValue("CUSTOM-N14");
    await wrapper.get('input[name="skus[0].code"]').trigger("blur");
    wrapper.findComponent({ name: "ImageUploader" }).vm.$emit("select", image);
    await wrapper.vm.$nextTick();
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].code"]').element.value,
    ).toBe("CUSTOM-N14-02");
    expect(wrapper.find('[data-testid="sku-code-status-0"]').exists()).toBe(
      false,
    );
    expect(wrapper.emitted("submit")).toHaveLength(1);
  });

  it("ignores an obsolete allocated-code response after SKU inputs change", async () => {
    const first =
      deferred<Awaited<ReturnType<typeof warehouseService.checkSkuCodes>>>();
    const second =
      deferred<Awaited<ReturnType<typeof warehouseService.checkSkuCodes>>>();
    vi.mocked(warehouseService.checkSkuCodes)
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const wrapper = mountForm();

    await selectSkuCatalog(wrapper);
    await wrapper.get('input[name="skus[0].weight"]').setValue("1");
    const firstCheck = (
      wrapper.vm as unknown as { checkSkuCodesNow(): Promise<boolean> }
    ).checkSkuCodesNow();
    await wrapper.get('input[name="skus[0].weight"]').setValue("2");
    const secondCheck = (
      wrapper.vm as unknown as { checkSkuCodesNow(): Promise<boolean> }
    ).checkSkuCodesNow();

    second.resolve({
      items: [{ code: "NH-B925-BM-2C" }],
    });
    expect(await secondCheck).toBe(true);
    first.resolve({
      items: [{ code: "NH-B925-BM-1C-99" }],
    });
    expect(await firstCheck).toBe(false);

    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].code"]').element.value,
    ).toBe("NH-B925-BM-2C");
  });

  it("blocks submission when a usable SKU code cannot be allocated", async () => {
    vi.mocked(warehouseService.checkSkuCodes).mockRejectedValue({
      message: "Mất kết nối API",
      code: "NETWORK_ERROR",
    });
    const wrapper = mountForm();
    const image = new File(["image"], "item.jpg", { type: "image/jpeg" });

    await wrapper.get('input[name="name"]').setValue("Nhẫn chờ kiểm tra");
    await selectSkuCatalog(wrapper);
    await wrapper.get('select[name="pricingType"]').setValue("Đồ món");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1");
    await wrapper.get('input[name="skus[0].importPrice"]').setValue("350000");
    wrapper.findComponent({ name: "ImageUploader" }).vm.$emit("select", image);
    await wrapper.vm.$nextTick();
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find('[data-testid="sku-code-status-0"]').exists()).toBe(
      false,
    );
    expect(wrapper.get('[role="alert"]').text()).toContain(
      "Không thể tạo mã SKU khả dụng",
    );
    expect(wrapper.emitted("submit")).toBeUndefined();
  });

  it("uses API-allocated codes for duplicate manual SKU inputs", async () => {
    vi.mocked(warehouseService.checkSkuCodes).mockImplementation(
      async (skus) => ({
        items: skus.map((sku, index) => ({
          code: index === 0 ? sku.code : `${sku.code}-02`,
        })),
      }),
    );
    const wrapper = mountForm();
    const image = new File(["image"], "item.jpg", { type: "image/jpeg" });

    await wrapper.get('input[name="name"]').setValue("Nhẫn nhiều ni");
    await selectSkuCatalog(wrapper);
    await wrapper.get('select[name="pricingType"]').setValue("Đồ món");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1");
    await wrapper.get('input[name="skus[0].importPrice"]').setValue("350000");
    await wrapper.get('[data-testid="add-sku"]').trigger("click");
    await wrapper.get('input[name="skus[1].weight"]').setValue("1.2");
    await wrapper.get('input[name="skus[1].importPrice"]').setValue("350000");
    const firstCode = wrapper.get<HTMLInputElement>(
      'input[name="skus[0].code"]',
    ).element.value;
    await wrapper.get('input[name="skus[0].code"]').setValue(firstCode);
    await wrapper.get('input[name="skus[1].code"]').setValue(firstCode);
    wrapper.findComponent({ name: "ImageUploader" }).vm.$emit("select", image);
    await wrapper.vm.$nextTick();
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    const submitted = wrapper.emitted("submit")?.[0]?.[0] as WarehouseFormModel;
    expect(submitted.skus.map((sku) => sku.code)).toEqual([
      firstCode,
      `${firstCode}-02`,
    ]);
  });

  it("rejects a generated or manual SKU code over 100 characters", async () => {
    const wrapper = mountForm();
    const image = new File(["image"], "item.jpg", { type: "image/jpeg" });

    await wrapper.get('input[name="name"]').setValue("Nhẫn mã dài");
    await selectSkuCatalog(wrapper);
    await wrapper.get('select[name="pricingType"]').setValue("Đồ món");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1");
    await wrapper.get('input[name="skus[0].importPrice"]').setValue("350000");
    await wrapper.get('input[name="skus[0].code"]').setValue("A".repeat(101));
    wrapper.findComponent({ name: "ImageUploader" }).vm.$emit("select", image);
    await wrapper.vm.$nextTick();
    await wrapper.get("form").trigger("submit");

    expect(wrapper.get('[role="alert"]').text()).toContain(
      "SKU 1: Mã SKU không được vượt quá 100 ký tự",
    );
    expect(wrapper.emitted("submit")).toBeUndefined();
  });

  it("shows weighted costs and updates the read-only selling price", async () => {
    const wrapper = mountForm();

    await wrapper.get('select[name="pricingType"]').setValue("Đồ cân");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1.5");
    await wrapper.get('input[name="skus[0].laborCost"]').setValue("200000");
    await wrapper.get('input[name="skus[0].platingCost"]').setValue("50000");

    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].laborCost"]').element
        .value,
    ).toBe("200,000");
    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].platingCost"]').element
        .value,
    ).toBe("50,000");
    expect(wrapper.find('input[name="skus[0].importPrice"]').exists()).toBe(
      false,
    );
    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].price"]').element
        .value,
    ).toBe("600000");
    expect(wrapper.get('[data-testid="pricing-formula-0"]').text()).toContain(
      "Giá bạc hiện tại",
    );
    expect(wrapper.get('[data-testid="pricing-formula-0"]').text()).toContain(
      "220.000 ₫",
    );
  });

  it("shows import price for Đồ món and applies the markup tier", async () => {
    const wrapper = mountForm();

    await wrapper.get('select[name="pricingType"]').setValue("Đồ món");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1");
    await wrapper.get('input[name="skus[0].importPrice"]').setValue("350000");

    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].importPrice"]').element
        .value,
    ).toBe("350,000");
    expect(wrapper.find('input[name="skus[0].laborCost"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('input[name="skus[0].platingCost"]').exists()).toBe(
      false,
    );
    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].price"]').element
        .value,
    ).toBe("650000");
    expect(wrapper.get('[data-testid="pricing-formula-0"]').text()).toContain(
      "giảm 5%",
    );
  });

  it("adds, prices, and removes independent SKU rows", async () => {
    const wrapper = mountForm();

    await wrapper.get('select[name="pricingType"]').setValue("Đồ món");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1");
    await wrapper.get('input[name="skus[0].importPrice"]').setValue("280000");
    await wrapper.get('[data-testid="add-sku"]').trigger("click");
    await wrapper.get('input[name="skus[1].weight"]').setValue("1.3");
    await wrapper.get('input[name="skus[1].importPrice"]').setValue("350000");

    expect(wrapper.findAll('[data-testid="sku-card"]')).toHaveLength(2);
    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[0].price"]').element
        .value,
    ).toBe("550000");
    expect(
      wrapper.get<HTMLInputElement>('input[name="skus[1].price"]').element
        .value,
    ).toBe("650000");

    await wrapper.get('[data-testid="remove-sku-1"]').trigger("click");
    expect(wrapper.findAll('[data-testid="sku-card"]')).toHaveLength(1);
    expect(wrapper.find('input[name="skus[1].weight"]').exists()).toBe(false);
  });

  it("keeps an independent required stock quantity for every SKU", async () => {
    const wrapper = mountForm();

    const firstStock = wrapper.get<HTMLInputElement>(
      'input[name="skus[0].stock"]',
    );
    expect(firstStock.element.value).toBe("0");
    expect(firstStock.attributes("required")).toBeDefined();
    expect(firstStock.attributes("min")).toBe("0");
    expect(firstStock.attributes("step")).toBe("1");

    await firstStock.setValue("3");
    await wrapper.get('[data-testid="add-sku"]').trigger("click");
    const secondStock = wrapper.get<HTMLInputElement>(
      'input[name="skus[1].stock"]',
    );
    expect(secondStock.element.value).toBe("0");
    await secondStock.setValue("7");

    const updates = wrapper.emitted<WarehouseFormModel[]>("update:modelValue");
    const latest = updates?.at(-1)?.[0];
    expect(latest?.skus.map((sku) => sku.stock)).toEqual([3, 7]);
    expect(latest?.stock).toBe(10);
  });

  it("supports ten SKU rows for one product", async () => {
    const wrapper = mountForm();

    for (let index = 1; index < 10; index += 1) {
      await wrapper.get('[data-testid="add-sku"]').trigger("click");
    }

    expect(wrapper.findAll('[data-testid="sku-card"]')).toHaveLength(10);
    expect(wrapper.get('input[name="skus[9].weight"]').exists()).toBe(true);
  });

  it("clears incompatible costs across every SKU when the product type changes", async () => {
    const wrapper = mountForm();

    await wrapper.get('select[name="pricingType"]').setValue("Đồ cân");
    await wrapper.get('[data-testid="add-sku"]').trigger("click");
    await wrapper.get('input[name="skus[0].laborCost"]').setValue("100000");
    await wrapper.get('input[name="skus[1].laborCost"]').setValue("200000");
    await wrapper.get('select[name="pricingType"]').setValue("Đồ món");

    const updates = wrapper.emitted<WarehouseFormModel[]>("update:modelValue");
    const latest = updates?.at(-1)?.[0];
    expect(latest?.skus.map((sku) => sku.laborCost)).toEqual([0, 0]);
    expect(wrapper.find('input[name="skus[0].laborCost"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('input[name="skus[1].laborCost"]').exists()).toBe(
      false,
    );
  });

  it("reports the exact invalid SKU before submission", async () => {
    const wrapper = mountForm();
    const image = new File(["image"], "item.jpg", { type: "image/jpeg" });

    await wrapper.get('input[name="name"]').setValue("Nhẫn nhiều ni");
    await wrapper.get('select[name="categoryId"]').setValue("category-1");
    await wrapper.get('select[name="materialId"]').setValue("material-1");
    await wrapper.get('select[name="patternId"]').setValue("pattern-1");
    await wrapper.get('select[name="pricingType"]').setValue("Đồ món");
    await wrapper.get('input[name="skus[0].weight"]').setValue("1");
    await wrapper.get('input[name="skus[0].importPrice"]').setValue("350000");
    await wrapper.get('[data-testid="add-sku"]').trigger("click");
    wrapper.findComponent({ name: "ImageUploader" }).vm.$emit("select", image);
    await wrapper.vm.$nextTick();
    await wrapper.get("form").trigger("submit");

    expect(wrapper.get('[role="alert"]').text()).toContain(
      "SKU 2: Trọng lượng chỉ phải lớn hơn 0",
    );
    expect(wrapper.emitted("submit")).toBeUndefined();
  });

  it("renders and focuses the exact SKU input returned by API validation", async () => {
    const form = emptyWarehouseForm();
    form.pricingType = "Đồ cân";
    form.skus.push({ ...form.skus[0], clientId: "sku-2", weight: 2 });
    const wrapper = mount(WarehouseCreateForm, {
      attachTo: document.body,
      props: {
        modelValue: form,
        options,
        fieldErrors: {
          "skus.1.weight": "SKU 2: Trọng lượng chỉ phải lớn hơn 0",
        },
      } as never,
      global: { stubs: { RouterLink: true } },
    });
    await wrapper.vm.$nextTick();

    const input = wrapper.get<HTMLInputElement>('input[name="skus[1].weight"]');
    expect(input.classes()).toContain("is-invalid");
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("#warehouse-error-skus-1-weight").text()).toContain(
      "Trọng lượng chỉ phải lớn hơn 0",
    );
    expect(document.activeElement).toBe(input.element);

    wrapper.unmount();
  });

  it("renders and focuses an exact SKU stock validation error", async () => {
    const form = emptyWarehouseForm();
    form.skus.push({ ...form.skus[0], clientId: "sku-2" });
    const wrapper = mount(WarehouseCreateForm, {
      attachTo: document.body,
      props: {
        modelValue: form,
        options,
        fieldErrors: {
          "skus.1.stock": "SKU 2: Tồn kho phải là số nguyên không âm",
        },
      } as never,
      global: { stubs: { RouterLink: true } },
    });
    await wrapper.vm.$nextTick();

    const input = wrapper.get<HTMLInputElement>('input[name="skus[1].stock"]');
    expect(input.classes()).toContain("is-invalid");
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("#warehouse-error-skus-1-stock").text()).toContain(
      "Tồn kho phải là số nguyên không âm",
    );
    expect(document.activeElement).toBe(input.element);

    wrapper.unmount();
  });

  it("renders and focuses an exact SKU selling-price validation error", async () => {
    const wrapper = mount(WarehouseCreateForm, {
      attachTo: document.body,
      props: {
        modelValue: emptyWarehouseForm(),
        options,
        fieldErrors: {
          "skus.0.price": "SKU 1: Giá bán không hợp lệ",
        },
      } as never,
      global: { stubs: { RouterLink: true } },
    });
    await wrapper.vm.$nextTick();

    const input = wrapper.get<HTMLInputElement>('input[name="skus[0].price"]');
    expect(input.classes()).toContain("is-invalid");
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("#warehouse-error-skus-0-price").text()).toContain(
      "Giá bán không hợp lệ",
    );
    expect(document.activeElement).toBe(input.element);

    wrapper.unmount();
  });
});
