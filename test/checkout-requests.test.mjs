import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { parse, compileScript } from "@vue/compiler-sfc";
const require = createRequire(import.meta.url),
  vue = require("vue");
const row = (id, status) => ({
  requestId: id,
  status,
  items: [{ quantity: 1 }],
  updatedAt: status,
});
function setup(latest = null) {
  const props = vue.reactive({ latest }),
    events = [],
    timers = new Map(),
    unmount = [],
    calls = [];
  const state = { active: [], details: {}, failure: false, hold: null };
  let timerId = 0;
  const deps = {
    vue: {
      ...vue,
      onMounted() {},
      onBeforeUnmount(fn) {
        unmount.push(fn);
      },
    },
    "@/request": { apiError: (e) => e, assetUrl: (v) => v },
    "@/views/Orders/service": {
      orderService: {
        async checkoutRequests(status, cursor) {
          calls.push([status, cursor]);
          if (state.failure) throw new Error("offline");
          return state.hold || { items: state.active, nextCursor: null };
        },
        async checkoutRequest(id) {
          return state.details[id];
        },
        async retryCheckout(id) {
          return row(id, "pending");
        },
      },
    },
  };
  const file = "src/views/Orders/components/CheckoutRequests.vue";
  const source = readFileSync(new URL("../" + file, import.meta.url), "utf8");
  const compiled = compileScript(parse(source, { filename: file }).descriptor, {
    id: file,
  }).content;
  const code = ts.transpileModule(compiled, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const context = vm.createContext({
    AbortController,
    document: {
      hidden: false,
      addEventListener() {},
      removeEventListener() {},
    },
    setTimeout(fn, ms) {
      timers.set(++timerId, { fn, ms });
      return timerId;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  });
  const module = { exports: {} };
  vm.runInContext(
    "(function(require,module,exports){" + code + "\n})",
    context,
  )((name) => deps[name] || require(name), module, module.exports);
  const page = module.exports.default.setup(props, {
    expose() {},
    emit: (...args) => events.push(args),
  });
  return { page, props, events, timers, calls, unmount, state };
}
test("empty queue is hidden; one active query and 60 second interval", async () => {
  const h = setup();
  await h.page.refresh();
  assert.equal(h.page.pendingCount.value, 0);
  assert.equal(h.page.failedItems.value.length, 0);
  assert.equal(h.page.error.value, "");
  assert.deepEqual(h.calls, [["active", undefined]]);
  assert.equal([...h.timers.values()][0].ms, 60000);
});
test("completion notifies list and checkout exactly once", async () => {
  const h = setup(row("a", "pending"));
  h.state.details.a = row("a", "completed");
  await h.page.refresh();
  assert.equal(h.page.pendingCount.value, 0);
  assert.equal(
    h.events.find(([name]) => name === "updated")[1].status,
    "completed",
  );
  await h.page.refresh();
  assert.equal(h.events.filter(([name]) => name === "completed").length, 1);
});
test("failure stays visible; retry restores rapid monitoring", async () => {
  const h = setup();
  h.state.active = [row("a", "failed")];
  await h.page.refresh();
  assert.equal(h.page.failedItems.value.length, 1);
  await h.page.retry(h.page.failedItems.value[0]);
  assert.equal(h.page.failedItems.value.length, 0);
  assert.equal(h.page.pendingCount.value, 1);
  assert.equal([...h.timers.values()][0].ms, 3000);
});
test("new checkout during refresh survives stale response", async () => {
  const h = setup();
  let resolve;
  h.state.hold = new Promise((done) => {
    resolve = done;
  });
  const fetching = h.page.refresh();
  h.props.latest = row("new", "pending");
  await vue.nextTick();
  resolve({ items: [], nextCursor: null });
  await fetching;
  assert.equal(h.page.items.value[0].requestId, "new");
  assert.equal([...h.timers.values()][0].ms, 3000);
});
test("network failure preserves pending order and warning clears on recovery", async () => {
  const h = setup(row("a", "pending"));
  h.state.failure = true;
  await h.page.refresh();
  assert.match(h.page.error.value, /offline/);
  assert.equal(h.page.pendingCount.value, 1);
  h.state.failure = false;
  h.state.active = [row("a", "pending")];
  await h.page.refresh();
  assert.equal(h.page.error.value, "");
});
test("unmount ignores late response and stops timers", async () => {
  const h = setup();
  let resolve;
  h.state.hold = new Promise((done) => {
    resolve = done;
  });
  const fetching = h.page.refresh();
  h.unmount.forEach((fn) => fn());
  resolve({ items: [row("a", "pending")], nextCursor: null });
  await fetching;
  assert.equal(h.page.items.value.length, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.events.length, 0);
});
