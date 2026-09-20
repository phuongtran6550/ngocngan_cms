import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { parse } from "@vue/compiler-sfc";

function setup(skus = []) {
  const emitted = [];
  const pricingMock = {
    calculateWeightedPrice: ({ silverPrice, weight, laborCost, platingCost }) => ({
      price: (silverPrice || 0) * (weight || 0) + (laborCost || 0) + (platingCost || 0),
      rawPrice: (silverPrice || 0) * (weight || 0),
    }),
    calculatePiecePrice: (importPrice, platingCost, laborCost) => ({
      price: importPrice * 2 + (platingCost || 0) + (laborCost || 0),
      rawPrice: importPrice * 2,
      discountRate: 0,
    }),
    estimatePieceImportPrice: (price) => ({ importPrice: Math.round(price / 2) }),
    estimatePieceImportPrices: () => [],
  };

  const deps = {
    vue: { defineComponent: (val) => val },
    "vue-router": { RouterLink: {} },
    "@/components/Form/FieldError.vue": {},
    "@/components/Form/AutoCompleteSelect.vue": {},
    "@/components/Form/MoneyInput.vue": {},
    "@/components/media/ImageUploader.vue": {},
    "@/utils/resource-display": {
      formatMoney: (v) => String(v || 0),
      formatNumberValue: (v) => String(v || 0),
    },
    "@/views/WarehousedGoods/pricing": pricingMock,
    "@/request": { request: { get: async () => ({ data: {} }) } },
    "@/views/WarehousedGoods/sku-code": {
      normalizeSkuCode: (v) => String(v || "").trim(),
      suggestSkuCodes: (items) => items,
    },
    "@/views/WarehousedGoods/service": {
      warehouseService: {
        checkSkuCodes: async (rows) => ({ items: rows }),
      },
    },
    "@/views/WarehousedGoods/types": {
      emptyWarehouseSku: (input = {}) => ({
        clientId: input.clientId || `sku-${Math.random()}`,
        code: input.code || "",
        codeMode: "auto",
        codeSource: "",
        size: input.size || "",
        weight: Number(input.weight) || 0,
        price: Number(input.price) || 0,
        laborCost: Number(input.laborCost) || 0,
        platingCost: Number(input.platingCost) || 0,
        importPrice: input.importPrice ?? null,
        stock: Number(input.stock) || 0,
      }),
    },
  };

  const source = readFileSync(
    new URL("../src/views/WarehousedGoods/components/WarehouseCreateForm.vue", import.meta.url),
    "utf8",
  );
  const transpiled = ts.transpileModule(parse(source).descriptor.script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const module = { exports: {} };
  const context = vm.createContext({ setTimeout, clearTimeout, AbortController });
  vm.runInContext(
    "(function(require,module,exports){" + transpiled + "\n})",
    context,
  )((name) => deps[name] || {}, module, module.exports);

  const component = module.exports.default;
  const initialModel = {
    name: "Sản phẩm test",
    categoryId: "cat-1",
    materialId: "mat-1",
    patternId: "pat-1",
    pricingType: "Đồ cân",
    skus: skus.map((s, idx) => ({
      clientId: s.clientId || `sku-${idx + 1}`,
      code: s.code || `SKU-${idx + 1}`,
      codeMode: "auto",
      codeSource: "",
      size: s.size || "",
      weight: Number(s.weight) || 0,
      stock: Number(s.stock) || 0,
      laborCost: Number(s.laborCost) || 0,
      platingCost: Number(s.platingCost) || 0,
      importPrice: null,
      price: 0,
    })),
    thumbnail: null,
  };

  const instance = {
    modelValue: initialModel,
    fieldErrors: {},
    options: {
      categories: [],
      materials: [],
      patterns: [],
      silverPrice: 85000,
    },
    ...component.data.call({ modelValue: initialModel }),
    $emit(evt, payload) {
      emitted.push({ evt, payload });
      if (evt === "update:modelValue") {
        this.modelValue = payload;
      }
    },
    $nextTick: async (fn) => (fn ? fn() : undefined),
    $el: null,
  };

  for (const [name, method] of Object.entries(component.methods)) {
    if (typeof method === "function") {
      instance[name] = method.bind(instance);
    }
  }

  return { instance, emitted };
}

test("sorts SKUs by weight ascending and descending", async () => {
  const { instance } = setup([
    { clientId: "s1", weight: 3.5, code: "SKU-3.5" },
    { clientId: "s2", weight: 1.2, code: "SKU-1.2" },
    { clientId: "s3", weight: 5.0, code: "SKU-5.0" },
  ]);

  instance.skuSortOption = "weight-asc";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.weight),
    [1.2, 3.5, 5.0],
  );

  instance.skuSortOption = "weight-desc";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.weight),
    [5.0, 3.5, 1.2],
  );
});

test("sorts SKUs by stock ascending and descending", async () => {
  const { instance } = setup([
    { clientId: "s1", stock: 10 },
    { clientId: "s2", stock: 2 },
    { clientId: "s3", stock: 25 },
  ]);

  instance.skuSortOption = "stock-asc";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.stock),
    [2, 10, 25],
  );

  instance.skuSortOption = "stock-desc";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.stock),
    [25, 10, 2],
  );
});

test("sorts SKUs by laborCost ascending and descending", async () => {
  const { instance } = setup([
    { clientId: "s1", laborCost: 50000 },
    { clientId: "s2", laborCost: 15000 },
    { clientId: "s3", laborCost: 80000 },
  ]);

  instance.skuSortOption = "laborCost-asc";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.laborCost),
    [15000, 50000, 80000],
  );

  instance.skuSortOption = "laborCost-desc";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.laborCost),
    [80000, 50000, 15000],
  );
});

test("sorts SKUs by platingCost ascending and descending", async () => {
  const { instance } = setup([
    { clientId: "s1", platingCost: 30000 },
    { clientId: "s2", platingCost: 10000 },
    { clientId: "s3", platingCost: 45000 },
  ]);

  instance.skuSortOption = "platingCost-asc";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.platingCost),
    [10000, 30000, 45000],
  );

  instance.skuSortOption = "platingCost-desc";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.platingCost),
    [45000, 30000, 10000],
  );
});

test("restores original SKU order when original option is selected", async () => {
  const { instance } = setup([
    { clientId: "s1", weight: 3.5 },
    { clientId: "s2", weight: 1.2 },
    { clientId: "s3", weight: 5.0 },
  ]);

  instance.skuSortOption = "weight-asc";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.clientId),
    ["s2", "s1", "s3"],
  );

  instance.skuSortOption = "original";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.clientId),
    ["s1", "s2", "s3"],
  );
});

test("preserves stable relative order between items with equal sort values", async () => {
  const { instance } = setup([
    { clientId: "s1", weight: 2.0, stock: 5 },
    { clientId: "s2", weight: 1.0, stock: 10 },
    { clientId: "s3", weight: 2.0, stock: 20 },
  ]);

  instance.skuSortOption = "weight-asc";
  await instance.handleSkuSortChange();
  assert.deepEqual(
    instance.draft.skus.map((s) => s.clientId),
    ["s2", "s1", "s3"],
  );
});

test("resets skuSortOption to empty string when SKU fields are modified or added", async () => {
  const { instance } = setup([
    { clientId: "s1", weight: 3.5 },
    { clientId: "s2", weight: 1.2 },
  ]);

  instance.skuSortOption = "weight-asc";
  await instance.handleSkuSortChange();
  assert.equal(instance.skuSortOption, "weight-asc");

  // Editing a number field resets skuSortOption
  instance.updateSkuNumber(0, "weight", { target: { value: "4.0" } });
  assert.equal(instance.skuSortOption, "");

  // Sorting again
  instance.skuSortOption = "weight-desc";
  await instance.handleSkuSortChange();
  assert.equal(instance.skuSortOption, "weight-desc");

  // Adding a SKU resets skuSortOption
  instance.addSku();
  assert.equal(instance.skuSortOption, "");
});
