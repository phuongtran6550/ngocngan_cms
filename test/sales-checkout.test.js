import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { compileScript, parse } from "@vue/compiler-sfc";

const require = createRequire(import.meta.url);
const { createPinia, setActivePinia } = require("pinia");
const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const storage = new Map();
const window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
};
const modules = new Map();

function load(name) {
  if (!name.startsWith("@/")) return require(name);
  if (modules.has(name)) return modules.get(name);
  return evaluate(`${sourceRoot}${name.slice(2)}.ts`, name);
}

function evaluate(file, name) {
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(
    `(function(require, module, exports, window) {${source}\n})`,
    { filename: file },
  )(load, module, module.exports, window);
  modules.set(name, module.exports);
  return module.exports;
}

const { isMissingSkuError, useSalesCartStore } = load("@/views/Orders/cart");

function sku(overrides = {}) {
  return {
    id: "sku-1",
    productId: "product-1",
    barcode: "893000000001",
    skuCode: "SKU-1",
    name: "Vòng bạc",
    thumbnail: "/sku.jpg",
    images: [],
    categoryId: "category-1",
    category: "Vòng",
    materialId: "material-1",
    material: "Bạc",
    patternId: "pattern-1",
    pattern: "Trơn",
    pricingType: "fixed",
    size: "16",
    weight: 2,
    price: 150000,
    stock: 5,
    laborCost: 0,
    platingCost: 0,
    importPrice: null,
    status: "active",
    ...overrides,
  };
}

function setupCart() {
  storage.clear();
  setActivePinia(createPinia());
  return useSalesCartStore();
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function checkoutSetup({
  checkout,
  productDetail = async () => sku(),
  optimizeImage = async (file, progress) => {
    progress(100);
    return file;
  },
}) {
  const vue = require("vue");
  const filename = `${sourceRoot}views/Orders/add.vue`;
  const { descriptor } = parse(readFileSync(filename, "utf8"), { filename });
  const compiled = compileScript(descriptor, {
    id: "sales-checkout-test",
  }).content;
  const source = ts.transpileModule(compiled, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const cart = vue.reactive({
    lines: [{ skuId: "sku-1", quantity: 1, stock: 5, status: "active" }],
    unverifiedSkuIds: [],
    get itemQuantity() {
      return this.lines.reduce((sum, line) => sum + line.quantity, 0);
    },
    get total() {
      return 150000;
    },
    get hasStockConflict() {
      return this.lines.some(
        (line) => line.status !== "active" || line.stock < line.quantity,
      );
    },
    get hasUnverifiedStock() {
      return this.unverifiedSkuIds.length > 0;
    },
    initialize() {},
    clear() {
      this.lines = [];
      this.unverifiedSkuIds = [];
    },
    refreshSku(value) {
      this.unverifiedSkuIds = this.unverifiedSkuIds.filter(
        (id) => id !== value.id,
      );
    },
    markUnverified(id) {
      if (!this.unverifiedSkuIds.includes(id)) this.unverifiedSkuIds.push(id);
    },
    markUnavailable(id) {
      this.markedUnavailable = id;
      this.unverifiedSkuIds = this.unverifiedSkuIds.filter(
        (value) => value !== id,
      );
    },
  });
  let unmount;
  const replacements = {
    vue: {
      ...vue,
      onMounted: () => {},
      onBeforeUnmount: (callback) => {
        unmount = callback;
      },
    },
    "@/request": { apiError: (error) => error },
    "@/utils/image-optimizer": {
      ORDER_PHOTO_IMAGE_OPTIMIZATION: load("@/utils/image-optimizer")
        .ORDER_PHOTO_IMAGE_OPTIMIZATION,
      optimizeImage,
    },
    "@/utils/resource-display": { formatMoney: String },
    "@/views/Orders/cart": {
      isMissingSkuError: (error) => error?.status === 404,
      useSalesCartStore: () => cart,
    },
    "@/views/Orders/service": {
      createOrderIdempotencyKey: () => "checkout-key",
      orderService: { checkout },
    },
    "@/views/Products/service": { productService: { detail: productDetail } },
    "@/stores/app-authen": { authenStore: () => ({ can: () => false }) },
  };
  const localRequire = (name) =>
    replacements[name] || (name.endsWith(".vue") ? {} : require(name));
  const module = { exports: {} };
  vm.runInThisContext(`(function(require, module, exports) {${source}\n})`, {
    filename,
  })(localRequire, module, module.exports);
  const bindings = module.exports.default.setup({}, { expose: () => {} });
  bindings.acceptPhoto(
    new File(["photo"], "order.jpg", { type: "image/jpeg" }),
  );
  bindings.name.value = "Khách A";
  bindings.phone.value = "0900000000";
  return { bindings, cart, nextTick: vue.nextTick, unmount };
}

test("transient verification failure preserves the line and retry success preserves quantity", () => {
  const cart = setupCart();
  cart.add(sku());
  cart.add(sku());
  const persistedBefore = storage.values().next().value;

  cart.markUnverified("sku-1");

  assert.equal(cart.lines[0].quantity, 2);
  assert.equal(cart.lines[0].stock, 5);
  assert.equal(cart.lines[0].status, "active");
  assert.equal(cart.hasUnverifiedStock, true);
  assert.equal(cart.isStockUnverified("sku-1"), true);
  assert.equal(storage.values().next().value, persistedBefore);

  cart.refreshSku(sku({ stock: 4, price: 160000 }));
  assert.equal(cart.lines[0].quantity, 2);
  assert.equal(cart.lines[0].stock, 4);
  assert.equal(cart.lines[0].unitPrice, 160000);
  assert.equal(cart.hasUnverifiedStock, false);
});

test("only a real missing response becomes unavailable; inactive detail remains blocked", () => {
  assert.equal(
    isMissingSkuError({ status: 503, message: "Unavailable" }),
    false,
  );
  assert.equal(
    isMissingSkuError({ code: "ERR_NETWORK", message: "Offline" }),
    false,
  );
  assert.equal(
    isMissingSkuError({ status: 404, code: "PRODUCT_SKU_NOT_FOUND" }),
    true,
  );

  const cart = setupCart();
  cart.add(sku());
  cart.refreshSku(sku({ status: "inactive" }));
  assert.equal(cart.hasStockConflict, true);
  assert.equal(cart.lines[0].stock, 5);

  cart.markUnavailable("sku-1");
  assert.equal(cart.lines[0].quantity, 1);
  assert.equal(cart.lines[0].stock, 0);
  assert.equal(cart.lines[0].status, "inactive");
  assert.equal(cart.isStockUnverified("sku-1"), false);
});

test("checkout UI locks customer input, blocks unverified stock, and keeps retry idempotency", () => {
  const page = readFileSync(`${sourceRoot}views/Orders/add.vue`, "utf8");
  const identity = readFileSync(
    `${sourceRoot}views/Orders/components/CustomerIdentityFields.vue`,
    "utf8",
  );
  const salesCart = readFileSync(
    `${sourceRoot}views/Orders/components/SalesCart.vue`,
    "utf8",
  );

  assert.match(page, /<CustomerIdentityFields[^>]+:disabled="submitting"/);
  assert.match(identity, /disabled\?: boolean/);
  assert.equal((identity.match(/:disabled="disabled"/g) || []).length, 2);
  assert.match(page, /!cart\.hasUnverifiedStock/);
  assert.match(page, /if \(!submitting\.value\) resetSubmitKey\(\)/);
  assert.match(page, /Đang hoàn tất\.\.\./);
  assert.match(page, /normalized\.details\?\.skuId/);
  assert.match(salesCart, /Chưa thể kiểm tra tồn kho/);
  assert.match(salesCart, /emit\(['"]retry['"], line\.skuId\)/);
});

test("checkout keeps one idempotency key while pending, clears on success, and keeps it for retry on failure", async () => {
  const pending = deferred();
  const success = checkoutSetup({ checkout: () => pending.promise });
  const request = success.bindings.checkout();
  await success.nextTick();
  assert.equal(success.bindings.submitting.value, true);
  assert.equal(success.bindings.submitKey.value, "checkout-key");

  success.bindings.name.value = "Không được đổi khi đang gửi";
  await success.nextTick();
  assert.equal(success.bindings.submitKey.value, "checkout-key");

  pending.resolve({ id: "order-1", orderCode: "DH-1" });
  await request;
  assert.equal(success.bindings.submitting.value, false);
  assert.equal(success.bindings.created.value.id, "order-1");
  assert.equal(success.bindings.submitKey.value, "");
  assert.equal(success.cart.lines.length, 0);

  const failure = checkoutSetup({
    checkout: async () => {
      throw { message: "Mất kết nối", status: 503 };
    },
  });
  await failure.bindings.checkout();
  assert.equal(failure.bindings.submitting.value, false);
  assert.equal(failure.bindings.error.value, "Mất kết nối");
  assert.equal(failure.bindings.submitKey.value, "checkout-key");
  failure.bindings.phone.value = "0911111111";
  await failure.nextTick();
  assert.equal(failure.bindings.submitKey.value, "");
});

test("checkout conflict refresh failure stays unverified instead of becoming unavailable", async () => {
  const page = checkoutSetup({
    checkout: async () => {
      throw {
        code: "ORDER_STOCK_INSUFFICIENT",
        message: "Conflict",
        details: { skuId: "sku-1" },
      };
    },
    productDetail: async () => {
      throw { status: 503, message: "Unavailable" };
    },
  });

  await page.bindings.checkout();

  assert.deepEqual(page.cart.unverifiedSkuIds, ["sku-1"]);
  assert.equal(page.cart.markedUnavailable, undefined);
  assert.equal(page.bindings.step.value, "cart");
  assert.equal(page.bindings.photo.value, null);
});

test("clearing the real cart removes persisted lines across initialization", () => {
  const cart = setupCart();
  cart.add(sku());
  assert.equal(cart.lines.length, 1);
  cart.clear();
  setActivePinia(createPinia());
  const restored = useSalesCartStore();
  restored.initialize();
  assert.equal(restored.lines.length, 0);
  assert.equal(restored.itemQuantity, 0);
});

test("photo preparation starts before checkout and its completed result survives upload retry", async (context) => {
  const prepared = new File(["prepared"], "prepared.jpg", {
    type: "image/jpeg",
  });
  let preparations = 0;
  const uploads = [];
  let started, finished;
  const page = checkoutSetup({
    optimizeImage: async (_file, progress) => {
      started = performance.now();
      preparations += 1;
      progress(100);
      finished = performance.now();
      return prepared;
    },
    checkout: async (input, key) => {
      uploads.push({ input, key });
      if (uploads.length === 1) throw { message: "Offline" };
      return { id: "order-1" };
    },
  });
  await page.nextTick();
  assert.equal(preparations, 1);
  assert.equal(uploads.length, 0);
  assert.equal(page.bindings.progress.value, 45);
  await page.bindings.checkout();
  assert.equal(page.cart.lines.length, 1);
  await page.bindings.checkout();
  assert.equal(preparations, 1);
  assert.equal(uploads.length, 2);
  assert.equal(uploads[0].input.image, prepared);
  assert.equal(uploads[1].input.image, prepared);
  assert.equal(uploads[0].key, uploads[1].key);
  context.diagnostic(
    `Preparation stub duration: ${(finished - started).toFixed(3)} ms; orchestration evidence only, not real compression speed.`,
  );
});

test("early and repeated checkout waits for the single preparation before upload and server success before clearing", async () => {
  const pending = deferred();
  const server = deferred();
  let preparations = 0;
  const uploads = [];
  const page = checkoutSetup({
    optimizeImage: () => {
      preparations += 1;
      return pending.promise;
    },
    checkout: (input) => {
      uploads.push(input);
      return server.promise;
    },
  });
  const request = page.bindings.checkout();
  await page.bindings.checkout();
  assert.equal(preparations, 1);
  assert.equal(uploads.length, 0);
  assert.equal(page.cart.lines.length, 1);
  const image = new File(["prepared"], "prepared.jpg");
  pending.resolve(image);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(uploads.length, 1);
  assert.equal(uploads[0].image, image);
  assert.equal(page.cart.lines.length, 1);
  server.resolve({ id: "order-1" });
  await request;
  assert.equal(page.cart.lines.length, 0);
});

test("retake discards old preparation and ignores its late progress and failure", async () => {
  const old = deferred();
  const latest = deferred();
  const callbacks = [];
  let uploaded;
  const page = checkoutSetup({
    optimizeImage: (_file, progress) => {
      callbacks.push(progress);
      return callbacks.length === 1 ? old.promise : latest.promise;
    },
    checkout: async (input) => {
      uploaded = input.image;
      return { id: "order-1" };
    },
  });
  page.bindings.retakePhoto();
  assert.equal(page.bindings.photo.value, null);
  assert.equal(page.bindings.canCheckout.value, false);
  const replacement = new File(["new"], "new.jpg");
  page.bindings.acceptPhoto(replacement);
  callbacks[1](20);
  callbacks[0](100);
  old.reject(new Error("Old decode failed"));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(page.bindings.progress.value, 9);
  assert.equal(page.bindings.error.value, "");
  const request = page.bindings.checkout();
  latest.resolve(replacement);
  await request;
  assert.equal(callbacks.length, 2);
  assert.equal(uploaded, replacement);
});

test("reset or cart mutation during preparation prevents stale upload", async () => {
  for (const reset of [
    (page) => page.bindings.returnToCart(),
    (page) => {
      page.cart.lines[0].quantity = 2;
    },
  ]) {
    const pending = deferred();
    let uploads = 0;
    const page = checkoutSetup({
      optimizeImage: () => pending.promise,
      checkout: async () => {
        uploads += 1;
        return { id: "unexpected" };
      },
    });
    reset(page);
    await page.nextTick();
    pending.resolve(new File(["old"], "old.jpg"));
    await page.bindings.checkout();
    assert.equal(uploads, 0);
    assert.equal(page.bindings.photo.value, null);
    assert.equal(page.cart.lines.length, 1);
  }
  const pending = deferred();
  let uploads = 0;
  const page = checkoutSetup({
    optimizeImage: () => pending.promise,
    checkout: async () => {
      uploads += 1;
      return { id: "unexpected" };
    },
  });
  const request = page.bindings.checkout();
  page.cart.lines[0].quantity = 2;
  await page.nextTick();
  pending.resolve(new File(["old"], "old.jpg"));
  await request;
  assert.equal(uploads, 0);
  assert.equal(page.bindings.submitting.value, false);
});

test("preparation failure is handled before checkout and reported without upload or repeated compression", async () => {
  const pending = deferred();
  let preparations = 0;
  let uploads = 0;
  const page = checkoutSetup({
    optimizeImage: () => {
      preparations += 1;
      return pending.promise;
    },
    checkout: async () => {
      uploads += 1;
      return { id: "unexpected" };
    },
  });
  pending.reject(new Error("Cannot decode image"));
  await new Promise((resolve) => setImmediate(resolve));
  await page.bindings.checkout();
  await page.bindings.checkout();
  assert.equal(
    page.bindings.error.value,
    "Cannot decode image. Vui lòng chụp hoặc chọn lại ảnh.",
  );
  assert.equal(page.bindings.submitting.value, false);
  assert.equal(preparations, 1);
  assert.equal(uploads, 0);
  assert.equal(page.cart.lines.length, 1);
});

test("server success leaves an empty usable cart and clears the previous order banner on the next scan", async () => {
  const page = checkoutSetup({
    checkout: async () => ({ id: "order-1", orderCode: "DH-1" }),
  });
  await page.bindings.checkout();
  assert.equal(page.bindings.created.value.orderCode, "DH-1");
  assert.equal(page.bindings.step.value, "cart");
  assert.equal(page.cart.lines.length, 0);
  assert.equal(page.bindings.submitting.value, false);
  const source = readFileSync(`${sourceRoot}views/Orders/add.vue`, "utf8");
  assert.doesNotMatch(source, /!created/);
  assert.match(source, /Đơn vừa lưu thành công/);
  page.cart.lines = [
    { skuId: "sku-2", quantity: 1, stock: 5, status: "active" },
  ];
  page.bindings.scannerFeedback("Đã thêm sản phẩm", true);
  assert.equal(page.bindings.created.value, null);
  assert.equal(page.bindings.canLockCart.value, true);
  page.bindings.lockCart();
  assert.equal(page.bindings.step.value, "photo");
});

test("unmount invalidates preparation and its late progress", async () => {
  const pending = deferred();
  let reportProgress;
  let uploads = 0;
  const page = checkoutSetup({
    optimizeImage: (_file, progress) => {
      reportProgress = progress;
      return pending.promise;
    },
    checkout: async () => {
      uploads += 1;
      return { id: "unexpected" };
    },
  });
  const request = page.bindings.checkout();
  page.unmount();
  reportProgress(100);
  pending.resolve(new File(["old"], "old.jpg"));
  await request;
  assert.equal(page.bindings.progress.value, 0);
  assert.equal(page.bindings.photo.value, null);
  assert.equal(uploads, 0);
});

test("early photo preparation retains real optimizer validation and order quality options", async () => {
  const optimizer = load("@/utils/image-optimizer");
  let options;
  const page = checkoutSetup({
    optimizeImage: async (_file, _progress, value) => {
      options = value;
      return new File([], "prepared.jpg");
    },
    checkout: async () => ({ id: "order-1" }),
  });
  assert.equal(options, optimizer.ORDER_PHOTO_IMAGE_OPTIMIZATION);
  const source = readFileSync(`${sourceRoot}views/Orders/add.vue`, "utf8");
  assert.match(source, /ORDER_PHOTO_IMAGE_OPTIMIZATION,\s*\)\.then/);
  assert.equal(optimizer.ORDER_PHOTO_IMAGE_OPTIMIZATION.maxEdge, 1600);
  assert.equal(optimizer.ORDER_PHOTO_IMAGE_OPTIMIZATION.jpegQuality, 0.84);
  page.unmount();
  for (const file of [
    new File(["invalid"], "invalid.txt", { type: "text/plain" }),
    { type: "image/jpeg", size: optimizer.MAX_IMAGE_BYTES + 1 },
  ]) {
    await assert.rejects(optimizer.optimizeImage(file), /định dạng|25 MB/);
  }
});
