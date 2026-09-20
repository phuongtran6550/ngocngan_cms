import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { parse } from "@vue/compiler-sfc";

const sku = (id, stock) => ({ id, code: id, stock, barcode: "10013406", printCount: 0 });
function setup(skus) {
  const calls = [], delays = [];
  const state = { product: { id: "product", skus }, failAt: -1, queued: true, hold: null };
  const deps = {
    vue: { defineComponent: value => value },
    "@/views/WarehousedGoods/service": { warehouseService: {
      async detail() { return state.hold || state.product; },
      async printLabel(...args) {
        calls.push(args);
        if (calls.length === state.failAt) throw new Error("offline");
        return { queued: state.queued, quantity: args[2] };
      },
    } },
    "@/request": { apiError: e => e },
    "@/views/PrintDevices/presentation": { labelPrintFailureMessage: () => "Không thể gửi lệnh in." },
    "@/views/WarehousedGoods/inventory-barcode": { isInventoryBarcode: value => /^(?:\d{8}|\d{12})$/.test(value || "") },
  };
  const source = readFileSync(new URL("../src/views/WarehousedGoods/detail.vue", import.meta.url), "utf8");
  const code = ts.transpileModule(parse(source).descriptor.script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const context = vm.createContext({ setTimeout(fn, ms) { delays.push(ms); fn(); }, clearTimeout() {} });
  vm.runInContext("(function(require,module,exports){" + code + "\n})", context)(name => deps[name] || {}, module, module.exports);
  const component = module.exports.default;
  const page = { ...component.data(), item: { id: "product", skus: [] }, $nextTick: async () => {}, $refs: {} };
  for (const [name, method] of Object.entries(component.methods)) if (typeof method === "function") page[name] = method.bind(page);
  return { page, state, calls, delays, unmount: () => component.beforeUnmount.call(page) };
}

test("all current SKUs print their latest stock, ignoring selection and zero/negative stock", async () => {
  const h = setup([sku("A", 2), sku("B", 1), sku("C", 0), sku("D", -1)]);
  h.page.selectedSkuIds = ["B"];
  await h.page.printAllStockLabels();
  assert.deepEqual(h.calls, [["product", "A", 2], ["product", "B", 1]]);
  assert.deepEqual(h.state.product.skus.map(s => s.stock), [2, 1, 0, -1]);
  assert.match(h.page.printSuccess, /3 tem của 2 SKU/);
  assert.equal(h.page.printingAll, false);
});
test("large stocks split into at most 100 labels and pace requests", async () => {
  const h = setup([sku("A", 201)]); await h.page.printAllStockLabels();
  assert.deepEqual(h.calls.map(call => call[2]), [100, 100, 1]);
  assert.deepEqual(h.delays, [2100, 2100]);
  assert.equal(h.state.product.skus[0].printCount, 3);
});
test("invalid barcode or fractional stock rejects the whole batch before printing", async () => {
  for (const invalid of [{ ...sku("B", 1), barcode: "bad" }, sku("B", 1.5)]) {
    const h = setup([sku("A", 2), invalid]); await h.page.printAllStockLabels();
    assert.equal(h.calls.length, 0); assert.match(h.page.printError, /Chưa gửi lệnh/);
  }
});
test("empty stock sends nothing", async () => {
  const h = setup([sku("A", 0)]); await h.page.printAllStockLabels();
  assert.equal(h.calls.length, 0); assert.match(h.page.printSuccess, /Không có SKU/);
});
test("partial failure stops subsequent SKUs and reports acknowledged quantity", async () => {
  const h = setup([sku("A", 2), sku("B", 1), sku("C", 3)]); h.state.failAt = 2;
  await h.page.printAllStockLabels();
  assert.equal(h.calls.length, 2); assert.match(h.page.printError, /Đã xác nhận 2 tem/);
  assert.match(h.page.printError, /SKU B, còn 1 tem/); assert.equal(h.page.printingAll, false);
});
test("missing acknowledgement never reports success", async () => {
  const h = setup([sku("A", 2)]); h.state.queued = false; await h.page.printAllStockLabels();
  assert.match(h.page.printError, /Đã xác nhận 0 tem/); assert.equal(h.page.printSuccess, "");
});
test("double click cannot dispatch two batches; single printing is blocked", async () => {
  const h = setup([sku("A", 2)]); let resolve;
  h.state.hold = new Promise(done => { resolve = done; });
  const first = h.page.printAllStockLabels(); await h.page.printAllStockLabels();
  await h.page.openPrintDialog(sku("B", 1)); assert.equal(h.page.printSku, null);
  resolve(h.state.product); await first; assert.equal(h.calls.length, 1);
});
test("leaving page before stock fetch finishes sends no print commands", async () => {
  const h = setup([sku("A", 2)]); let resolve;
  h.state.hold = new Promise(done => { resolve = done; });
  const pending = h.page.printAllStockLabels(); h.unmount(); resolve(h.state.product); await pending;
  assert.equal(h.calls.length, 0);
});
test("existing single SKU dialog still defaults to stock and submits edited quantity", async () => {
  const h = setup([sku("A", 2)]);
  const selected = h.state.product.skus[0];
  await h.page.openPrintDialog(selected);
  assert.equal(h.page.printQuantity, "2");
  h.page.updatePrintQuantity("3");
  await h.page.confirmPrintLabel();
  assert.deepEqual(h.calls, [["product", "A", 3]]);
  assert.equal(h.page.printSku, null);
  assert.equal(selected.printCount, 1);
});
