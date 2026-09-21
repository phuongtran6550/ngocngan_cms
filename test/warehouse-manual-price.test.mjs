import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { parse } from "@vue/compiler-sfc";

function load(file, deps = {}) {
  const source = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
  const code = ts.transpileModule(file.endsWith(".vue") ? parse(source).descriptor.script.content : source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext("(function(require,module,exports){" + code + "\n})", {
    setTimeout, clearTimeout, AbortController, FormData, File,
  })(name => deps[name] || {}, module, module.exports);
  return module.exports;
}

const types = load("views/WarehousedGoods/types.ts");
const pricing = load("views/WarehousedGoods/pricing.ts");
const deps = {
  vue: { defineComponent: value => value },
  "@/views/WarehousedGoods/types": types,
  "@/views/WarehousedGoods/pricing": pricing,
  "@/views/WarehousedGoods/sku-code": { normalizeSkuCode: value => value.trim(), suggestSkuCodes: rows => rows },
  "@/components/overlay/behavior": { createOverlayBehavior: () => ({ sync() {}, dispose() {} }) },
};
const sku = () => types.emptyWarehouseSku({
  id: "sku", code: "V-VTKB561C8", codeMode: "manual", weight: 1.8,
  laborCost: 130000, price: 730000, stock: 7,
});
const item = () => ({ id: "product", name: "Vòng", pricingType: "Đồ cân", skus: [sku()] });

function instance(component, props) {
  const emitted = [];
  const page = { ...props, ...component.data.call(props), $emit: (...args) => emitted.push(args), $nextTick: async () => {} };
  for (const [name, method] of Object.entries(component.methods)) {
    if (typeof method === "function") page[name] = method.bind(page);
  }
  for (const [name, getter] of Object.entries(component.computed || {})) Object.defineProperty(page, name, { get: () => getter.call(page) });
  return { page, emitted };
}

test("edit checkbox preserves input across cost changes and reopen; uncheck recalculates", () => {
  const component = load("views/WarehousedGoods/components/WarehouseSkuModal.vue", deps).default;
  const { page, emitted } = instance(component, { sku: sku(), product: item(), silverPrice: 221000, existingCodes: [] });
  page.updateManualPrice({ target: { checked: true } });
  page.updatePrice(550000);
  page.updateLaborCost(140000);
  page.updatePlatingCost(10000);
  page.updateWeight({ target: { value: "2" } });
  assert.equal(page.draft.price, 550000);
  page.submit();
  const saved = emitted.find(([event]) => event === "submit")[1];
  assert.equal(saved.manualPrice, true);
  assert.equal(saved.price, 550000);
  const reopened = instance(component, { sku: saved, product: item(), silverPrice: 221000, existingCodes: [] }).page;
  reopened.recalculatePrice();
  assert.equal(reopened.draft.price, 550000);
  reopened.updateManualPrice({ target: { checked: false } });
  assert.equal(reopened.draft.price, pricing.calculateWeightedPrice({ ...saved, silverPrice: 221000 }).price);
  assert.equal(reopened.draft.stock, 7);
});

test("manual edit validates price, permits missing silver price, and does not change piece import cost", () => {
  const component = load("views/WarehousedGoods/components/WarehouseSkuModal.vue", deps).default;
  const { page } = instance(component, { sku: { ...sku(), manualPrice: true }, product: item(), silverPrice: null, existingCodes: [] });
  for (const price of [0, -1, NaN, Infinity]) {
    page.updatePrice(price);
    assert.equal(page.validate(), false);
    assert.ok(page.fieldErrors.price);
  }
  page.updatePrice(550000);
  assert.equal(page.validate(), true);
  page.updateManualPrice({ target: { checked: false } });
  assert.equal(page.validate(), false);
  page.product.pricingType = "Đồ món";
  page.updateManualPrice({ target: { checked: true } });
  page.updatePieceImportPrice(100000);
  page.updatePrice(123456);
  page.updatePieceImportPrice(200000);
  assert.equal(page.draft.price, 123456);
  assert.equal(page.draft.importPrice, 200000);
  page.updateManualPrice({ target: { checked: false } });
  assert.equal(page.draft.price, pricing.calculatePiecePrice(200000, 0, 130000).price);
});

test("create form isolates price modes per SKU and preserves them when editing costs", () => {
  const component = load("views/WarehousedGoods/components/WarehouseCreateForm.vue", deps).default;
  const { page } = instance(component, {
    modelValue: { ...types.warehouseFormFromItem(item()), skus: [sku(), { ...sku(), clientId: "second" }] },
    options: { silverPrice: 221000, categories: [], materials: [], patterns: [] }, fieldErrors: {},
  });
  page.updateManualPrice(0, { target: { checked: true } });
  page.updateSkuMoney(0, "price", 550000);
  page.updateSkuMoney(0, "laborCost", 140000);
  page.updateSkuNumber(0, "weight", { target: { value: "2" } });
  assert.equal(page.draft.skus[0].price, 550000);
  assert.equal(page.draft.skus[1].price, 730000);
  page.updateManualPrice(0, { target: { checked: false } });
  assert.equal(page.draft.skus[0].price, pricing.calculateWeightedPrice({ ...page.draft.skus[0], silverPrice: 221000 }).price);
  assert.equal(page.draft.skus[1].price, 730000);
  page.draft.pricingType = "Đồ món";
  page.updateSkuMoney(0, "importPrice", 100000);
  page.updateManualPrice(0, { target: { checked: true } });
  page.updateSkuMoney(0, "price", 123456);
  page.updateSkuMoney(0, "importPrice", 200000);
  assert.equal(page.draft.skus[0].price, 123456);
  assert.equal(page.draft.skus[0].importPrice, 200000);
});

test("multipart transport includes false and true price modes; returned prices drive the list", async () => {
  const received = [];
  const service = load("views/WarehousedGoods/service.ts", { "@/request": { request: {
    async patch(url, body) {
      const skus = JSON.parse(body.get("skus"));
      received.push(skus);
      return { data: { ...item(), skus } };
    },
  } } }).warehouseService;
  for (const manualPrice of [true, false]) {
    const form = types.warehouseFormFromItem(item());
    form.skus[0] = { ...form.skus[0], manualPrice, price: manualPrice ? 550000 : 730000 };
    const saved = await service.update("product", form);
    assert.equal(saved.skus[0].manualPrice, manualPrice);
    assert.equal(saved.skus[0].price, form.skus[0].price);
    assert.equal(types.warehouseFormFromItem(saved).skus[0].manualPrice, manualPrice);
  }
  assert.deepEqual(received.map(rows => rows[0].manualPrice), [true, false]);
});

test("successful SKU saves close the modal after the response; failures keep the draft open", async (t) => {
  for (const outcome of ["edit", "add", "failure"]) {
    let finish;
    const response = new Promise((resolve, reject) => { finish = { resolve, reject }; });
    const component = load("views/WarehousedGoods/detail.vue", {
      ...deps,
      "@/request": { apiError: error => error },
      "@/views/WarehousedGoods/service": { warehouseService: { update: () => response } },
    }).default;
    const { page } = instance(component, {});
    t.after(() => { clearTimeout(page.skuToastTimeout); clearTimeout(page.skuActionTimeout); });
    page.item = item();
    if (outcome === "add") page.openAddSkuModal();
    else page.openEditSkuModal(page.item.skus[0]);
    const draft = { ...sku(), manualPrice: true, price: 550000 };
    const pending = page.saveSku(draft);
    page.closeSkuModal();
    assert.equal(page.skuModalOpen, true, "cancel stays blocked while saving");
    assert.equal(page.skuModalSubmitting, true);
    if (outcome === "failure") finish.reject(new Error("Không lưu được"));
    else finish.resolve({ ...item(), skus: [draft] });
    await pending;
    assert.equal(page.skuModalSubmitting, false);
    assert.equal(page.skuModalOpen, outcome === "failure");
    if (outcome === "failure") {
      assert.equal(page.item.skus[0].price, 730000);
      assert.equal(page.skuModalError, "Không lưu được");
    } else {
      assert.equal(page.editingSku, null);
      assert.equal(page.item.skus[0].price, 550000);
    }
  }
});
