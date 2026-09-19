import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { compileScript, parse } from "@vue/compiler-sfc";
import ts from "typescript";

const require = createRequire(import.meta.url);
const vue = require("vue");
const { createPinia, setActivePinia } = require("pinia");
const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));

function transpile(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}

function evaluate(source, filename, replacements = {}) {
  const localRequire = (name) => {
    if (name in replacements) return replacements[name];
    if (name.endsWith(".vue")) return { default: {} };
    return require(name);
  };
  const module = { exports: {} };
  vm.runInThisContext(
    `(function(require, module, exports) {${transpile(source)}\n})`,
    { filename },
  )(localRequire, module, module.exports);
  return module.exports;
}

function loadSfc(path, replacements = {}) {
  const filename = `${sourceRoot}${path}`;
  const { descriptor } = parse(readFileSync(filename, "utf8"), { filename });
  const source = compileScript(descriptor, { id: `cms-baseline-${path}` }).content;
  return evaluate(source, filename, replacements).default;
}

function listResult(page) {
  return { items: [], page, limit: 20, total: 0, totalPages: 0 };
}

test("login without a return URL opens the first permitted menu", async () => {
  const page = loadSfc("views/Account/login.vue", {
    vue,
    "@/config/brand": { brand: {} },
    "@/config/navigation": {
      visibleNavigation: () => [{ path: "/orders" }, { path: "/products" }],
      internalRedirectTarget: () => undefined,
    },
    "@/request": { apiError: (error) => error },
    "@/stores/app-authen": { authenStore: () => ({}) },
  });
  const events = [];
  const instance = {
    error: "", form: {},
    auth: { permissions: ["orders.view", "products.view"], user: { role: "USER" }, login: async () => { events.push("login"); } },
    $route: { query: {} },
    $router: { replace: async (path) => { events.push(path); } },
  };
  await page.methods.submit.call(instance);
  assert.deepEqual(events, ["login", "/orders"]);
  assert.equal(instance.error, "");
});

test("store load defaults keep the current page while explicit page one wins", async () => {
  const specs = [
    {
      file: "views/Administrator/Roles/store.ts",
      exportName: "useRoleStore",
      serviceModule: "@/views/Administrator/Roles/service",
      serviceName: "roleService",
    },
    {
      file: "views/Administrator/User/store.ts",
      exportName: "useUserStore",
      serviceModule: "@/views/Administrator/User/service",
      serviceName: "userService",
      extra: { "@/views/Administrator/User/types": {
        emptyUserForm: () => ({ name: "", username: "", password: "", role: "USER", roleId: "" }),
        userFormFromItem: (item) => item,
      }, "@/views/Administrator/Roles/service": { roleService: {} } },
    },
    {
      file: "views/Customers/store.ts",
      exportName: "useCustomerStore",
      serviceModule: "@/views/Customers/service",
      serviceName: "customerService",
      customer: true,
    },
    {
      file: "views/Orders/store.ts",
      exportName: "useOrderStore",
      serviceModule: "@/views/Orders/service",
      serviceName: "orderService",
      extra: {
        "@/views/Orders/types": { orderWithDisplayFields: (item) => item },
        "@/utils/image-optimizer": { optimizeImage: async (file) => file },
      },
    },
    {
      file: "views/Products/store.ts",
      exportName: "useProductStore",
      serviceModule: "@/views/Products/service",
      serviceName: "productService",
    },
    {
      file: "views/Sources/store.ts",
      exportName: "useSourceStore",
      serviceModule: "@/views/Sources/service",
      serviceName: "sourceService",
    },
    {
      file: "views/WarehousedGoods/store.ts",
      exportName: "useWarehouseStore",
      serviceModule: "@/views/WarehousedGoods/service",
      serviceName: "warehouseService",
    },
  ];

  for (const spec of specs) {
    const pages = [];
    const service = {
      list: async (...args) => {
        const params = spec.customer ? args[1] : args[0];
        pages.push(params.page);
        return listResult(params.page);
      },
    };
    const replacements = {
      pinia: require("pinia"),
      "@/request": { apiError: (error) => error },
      [spec.serviceModule]: { [spec.serviceName]: service },
      ...spec.extra,
    };
    const filename = `${sourceRoot}${spec.file}`;
    const module = evaluate(readFileSync(filename, "utf8"), filename, replacements);
    setActivePinia(createPinia());
    const store = module[spec.exportName]();
    store.pagination.page = 3;
    await store.load();
    await store.load(1);
    assert.deepEqual(pages, [3, 1], spec.file);
  }
});

test("role and user drawers accept their real forms and reject malformed forms", () => {
  const roleTypes = evaluate(
    readFileSync(`${sourceRoot}views/Administrator/Roles/types.ts`, "utf8"),
    `${sourceRoot}views/Administrator/Roles/types.ts`,
  );
  const userTypes = evaluate(
    readFileSync(`${sourceRoot}views/Administrator/User/types.ts`, "utf8"),
    `${sourceRoot}views/Administrator/User/types.ts`,
  );
  const rolePage = loadSfc("views/Administrator/Roles/index.vue", {
    vue,
    "@/request": { apiError: (error) => error },
    "@/views/Administrator/Roles/config": { roleResource: {} },
    "@/views/Administrator/Roles/service": { roleService: {} },
    "@/views/Administrator/Roles/types": roleTypes,
  });
  const userPage = loadSfc("views/Administrator/User/index.vue", {
    vue,
    "@/request": { apiError: (error) => error },
    "@/views/Administrator/Roles/service": { roleService: {} },
    "@/views/Administrator/User/config": { userResource: {} },
    "@/views/Administrator/User/types": userTypes,
  });
  const emptyRole = { name: "", description: "", permissions: [] };
  const roleFromItem = { name: "Bán hàng", description: "Quản lý đơn", permissions: ["orders.view"] };
  const emptyUser = userTypes.emptyUserForm();
  const userFromItem = userTypes.userFormFromItem({
    name: "Ngọc",
    username: "ngoc",
    role: "USER",
    roleId: "role-1",
  });

  assert.equal(rolePage.methods.isRoleFormModel(emptyRole), true);
  assert.equal(rolePage.methods.isRoleFormModel(roleFromItem), true);
  assert.equal(rolePage.methods.isRoleFormModel({ ...emptyRole, permissions: [1] }), false);
  assert.equal(userPage.methods.isUserFormModel(emptyUser), true);
  assert.equal(userPage.methods.isUserFormModel(userFromItem), true);
  assert.equal(userPage.methods.isUserFormModel({ ...emptyUser, role: "OWNER" }), false);
});

function scannerBindings(scanFile) {
  const camera = {
    active: vue.ref(false),
    torchAvailable: vue.ref(false),
    torchEnabled: vue.ref(false),
    scanFile,
    start: async () => {},
    stop: () => {},
    pause: () => {},
    resume: () => {},
    toggleTorch: async () => {},
  };
  let cameraOptions;
  const component = loadSfc("views/Products/components/ProductBarcodeScanner.vue", {
    vue: {
      ...vue,
      onBeforeUnmount: () => {},
      onMounted: () => {},
      watch: () => {},
    },
    "@/components/overlay/behavior": {
      createOverlayBehavior: () => ({ sync: () => {}, dispose: () => {} }),
    },
    "@/request": { apiError: (error) => error },
    "@/views/Products/service": { productService: {} },
    "@/views/Products/scanner/useBarcodeCamera": {
      useBarcodeCamera: (options) => {
        cameraOptions = options;
        return camera;
      },
    },
    "@/views/Products/scanner/zxing-reader": { preloadBarcodeReader: async () => {} },
  });
  const bindings = component.setup(
    { open: true, continuous: false, title: "Scanner", description: "Scan" },
    { emit: () => {}, expose: () => {} },
  );
  return { bindings, cameraOptions };
}

test("scanner preserves decoder errors and only adds fallback for an unreadable image", async () => {
  let options;
  const decoder = scannerBindings(async () => {
    options.onError({ code: "decoder", message: "Decoder failed" });
    return null;
  });
  options = decoder.cameraOptions;
  await decoder.bindings.scanSelectedFile({ target: { files: [{}], value: "selected" } });
  assert.equal(decoder.bindings.state.value, "camera-error");
  assert.equal(decoder.bindings.message.value, "Decoder failed");

  const unreadable = scannerBindings(async () => null);
  await unreadable.bindings.scanSelectedFile({ target: { files: [{}], value: "selected" } });
  assert.equal(unreadable.bindings.state.value, "camera-error");
  assert.equal(unreadable.bindings.message.value, "Không đọc được barcode rõ ràng từ ảnh đã chọn.");
});

test("field selector mounts and disposes its dropdown behavior", () => {
  let dismiss;
  let mounted = 0;
  let disposed = 0;
  const component = loadSfc("components/Table/FieldSelector.vue", {
    vue,
    "@/components/dropdown/behavior": {
      createDropdownBehavior: (_root, onDismiss) => {
        dismiss = onDismiss;
        return {
          mount: () => { mounted += 1; },
          dispose: () => { disposed += 1; },
        };
      },
    },
  });
  const instance = {
    ...component.data.call({}),
    $refs: { menu: {} },
  };
  component.mounted.call(instance);
  instance.open = true;
  dismiss();
  component.beforeUnmount.call(instance);

  assert.equal(mounted, 1);
  assert.equal(instance.open, false);
  assert.equal(disposed, 1);
});
