import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const vue = require("vue");
const plain = (value) => JSON.parse(JSON.stringify(value));
const flush = () => new Promise(setImmediate);
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup({ width = 1920, height = 1080, continuous = true } = {}) {
  const frames = new Map(),
    events = new Map(),
    unmount = [];
  const draws = [],
    reads = [],
    detections = [],
    errors = [],
    focusCalls = [];
  let frameId = 0,
    now = 0,
    decodeResult = [],
    focusResult = "point",
    stopped = 0;
  const viewport = {
    clientWidth: 360,
    clientHeight: 360,
    getBoundingClientRect: () => ({
      left: 10,
      top: 20,
      width: 360,
      height: 360,
    }),
  };
  let camera;
  const video = {
    videoWidth: width,
    videoHeight: height,
    readyState: 2,
    clientWidth: 999,
    clientHeight: 999,
    getBoundingClientRect() {
      const w = parseFloat(camera.previewStyle.value.width) * 3.6;
      const h = parseFloat(camera.previewStyle.value.height) * 3.6;
      return { left: 190 - w / 2, top: 200 - h / 2, width: w, height: h };
    },
  };
  const track = {};
  const stream = { getVideoTracks: () => [track] };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: (...args) => draws.push(args),
      getImageData: (...args) => ({ dimensions: args }),
    }),
  };
  const cameraModule = {
    requestEnvironmentCamera: async () => stream,
    attachEnvironmentCamera: async () => { },
    prepareEnvironmentCameraTrack: async () => ({ torchAvailable: true }),
    setEnvironmentCameraTorch: async () => { },
    stopEnvironmentCamera: (value) => {
      if (value) stopped++;
    },
    normalizeEnvironmentCameraError: () => ({ code: "camera" }),
    setEnvironmentCameraFocus: async (target, point) => {
      focusCalls.push({ target, point });
      return focusResult;
    },
  };
  const deps = {
    vue: { ...vue, onBeforeUnmount: (callback) => unmount.push(callback) },
    "@/components/media/environment-camera": cameraModule,
    "@/views/Products/scanner/zxing-reader": {
      readBarcodeValues: async (...args) => {
        reads.push(args);
        return decodeResult;
      },
    },
  };
  const document = {
    hidden: false,
    createElement: () => canvas,
    addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: (name) => events.delete(name),
  };
  const context = vm.createContext({
    document,
    window: {
      addEventListener: (name, callback) => events.set(name, callback),
      removeEventListener: (name) => events.delete(name),
    },
    HTMLMediaElement: { HAVE_CURRENT_DATA: 2 },
    performance: { now: () => now },
    requestAnimationFrame: (callback) => {
      frames.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  const cache = new Map();
  function load(name) {
    if (name in deps) return deps[name];
    if (!cache.has(name)) {
      const source = readFileSync(
        new URL("../src/" + name.slice(2) + ".ts", import.meta.url),
        "utf8",
      );
      const code = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText;
      const module = { exports: {} };
      vm.runInContext(
        "(function(require,module,exports){" + code + "\n})",
        context,
      )(load, module, module.exports);
      cache.set(name, module.exports);
    }
    return cache.get(name);
  }
  const exports = load("@/views/Products/scanner/useBarcodeCamera");
  camera = exports.useBarcodeCamera({
    video: vue.ref(video),
    viewport: vue.ref(viewport),
    continuous,
    onDetected: (value) => detections.push(value),
    onError: (error) => errors.push(error),
  });
  return {
    camera,
    region: exports.barcodeGuideSourceRegion,
    video,
    viewport,
    draws,
    reads,
    detections,
    errors,
    focusCalls,
    events,
    frames,
    document,
    cameraModule,
    get stopped() {
      return stopped;
    },
    set focusResult(value) {
      focusResult = value;
    },
    async frame(time, result = []) {
      now = time;
      decodeResult = result;
      const entry = frames.entries().next().value;
      assert.ok(entry, "camera should have a scheduled frame");
      frames.delete(entry[0]);
      entry[1](time);
      await flush();
    },
    unmount() {
      unmount.forEach((callback) => callback());
    },
  };
}

test("guide 1x keeps exact legacy rounding, .5/2/3 clip correctly in both orientations", () => {
  const f = setup();
  for (const [w, h] of [
    [1920, 1080],
    [1080, 1920],
    [1279, 721],
  ]) {
    const scale = 360 / Math.min(w, h);
    const x = Math.max(
      Math.round((18 + Math.max((w * scale - 360) / 2, 0)) / scale),
      0,
    );
    const y = Math.max(
      Math.round((99 + Math.max((h * scale - 360) / 2, 0)) / scale),
      0,
    );
    assert.deepEqual(plain(f.region(w, h, 360, 360)), {
      x,
      y,
      width: Math.min(Math.max(Math.round(324 / scale), 1), w - x),
      height: Math.min(Math.max(Math.round(162 / scale), 1), h - y),
    });
    for (const zoom of [0.5, 2, 3]) {
      const region = f.region(w, h, 360, 360, zoom);
      assert.ok(region.x >= 0 && region.y >= 0);
      assert.ok(region.x + region.width <= w && region.y + region.height <= h);
      assert.ok(Math.abs(region.width - Math.min(w, 324 / scale / zoom)) <= 1);
      assert.ok(Math.abs(region.height - Math.min(h, 162 / scale / zoom)) <= 1);
    }
  }
  assert.deepEqual(plain(f.region(1920, 1080, 360, 360, 0.5)), {
    x: 0,
    y: 54,
    width: 1920,
    height: 972,
  });
  assert.deepEqual(plain(f.region(1920, 1080, 360, 360, 2)), {
    x: 717,
    y: 419,
    width: 486,
    height: 243,
  });
  f.unmount();
});

test("natural-aspect preview reveals source at .5; source rotation updates dimensions", async () => {
  const f = setup();
  await f.camera.start();
  assert.equal(f.camera.previewStyle.value.height, "100%");
  assert.ok(
    Math.abs(parseFloat(f.camera.previewStyle.value.width) - 177.7777777778) <
    1e-7,
  );
  f.camera.setZoom(0.5);
  assert.equal(f.camera.previewStyle.value.height, "50%");
  assert.ok(parseFloat(f.camera.previewStyle.value.width) < 100);
  f.camera.setZoom(99);
  assert.equal(f.camera.zoom.value, 3);
  f.camera.setZoom(NaN);
  assert.equal(f.camera.zoom.value, 3);
  f.camera.setZoom(-1);
  assert.equal(f.camera.zoom.value, 0.5);
  f.video.videoWidth = 1080;
  f.video.videoHeight = 1920;
  f.camera.updateFrame();
  assert.equal(f.camera.previewStyle.value.width, "50%");
  await f.camera.start();
  assert.equal(f.camera.zoom.value, 1);
  f.unmount();
  assert.equal(f.events.size, 0);
  assert.equal(f.frames.size, 0);
});

test("actual canvas crop and fifth recovery pass follow zoom; retain full sensor at1x", async () => {
  for (const zoom of [0.5, 1, 2, 3]) {
    const f = setup();
    await f.camera.start();
    f.camera.setZoom(zoom);
    for (let frame = 1; frame <= 5; frame++) await f.frame(frame * 120);
    assert.equal(f.reads[0][1], "fast");
    assert.equal(f.reads[4][1], "recovery");
    const expected = f.region(1920, 1080, 360, 360, zoom);
    assert.deepEqual(f.draws[0].slice(1, 5), [
      expected.x,
      expected.y,
      expected.width,
      expected.height,
    ]);
    const recovery =
      zoom === 1
        ? { x: 0, y: 0, width: 1920, height: 1080 }
        : f.region(1920, 1080, 360, 360, zoom, true);
    assert.deepEqual(f.draws[4].slice(1, 5), [
      recovery.x,
      recovery.y,
      recovery.width,
      recovery.height,
    ]);
    assert.ok(Math.max(...f.draws[4].slice(-2)) <= 1280);
    if (zoom > 1) assert.ok(recovery.width < 1080 && recovery.height < 1080);
    f.unmount();
  }
});

test("120ms throttle and continuous barcode block survive zoom without duplicate additions", async () => {
  const f = setup();
  await f.camera.start();
  await f.frame(119, ["12345678"]);
  assert.equal(f.reads.length, 0);
  await f.frame(120, ["12345678"]);
  await f.frame(240, ["12345678"]);
  assert.equal(f.detections.length, 1);
  await f.frame(360, ["12345678"]);
  assert.equal(f.reads.length, 2);
  f.camera.resume();
  f.camera.setZoom(2);
  await f.frame(480, ["12345678"]);
  await f.frame(600, ["12345678"]);
  assert.equal(f.detections.length, 1);
  await f.frame(720, []);
  await f.frame(840, ["12345678"]);
  await f.frame(960, ["12345678"]);
  assert.equal(f.detections.length, 2);
  f.unmount();
});

test("late decoder result ignored after zoom, stop and unmount; no overlapping decode", async () => {
  for (const interrupt of [
    (f) => f.camera.setZoom(2),
    (f) => f.camera.stop(),
    (f) => f.unmount(),
  ]) {
    const f = setup();
    await f.camera.start();
    await f.frame(120, ["12345678"]);
    const pending = deferred();
    await f.frame(240, pending.promise);
    await f.frame(360);
    assert.equal(f.reads.length, 2);
    interrupt(f);
    pending.resolve(["12345678"]);
    await flush();
    assert.equal(f.detections.length, 0);
    f.unmount();
  }
});

test("focus point maps transformed source, ignores letterbox and shows no false success", async () => {
  const f = setup();
  await f.camera.start();
  f.camera.setZoom(2);
  await f.camera.focusAt({ clientX: 280, clientY: 200 });
  assert.ok(Math.abs(f.focusCalls[0].point.x - 0.5703125) < 1e-8);
  assert.equal(f.focusCalls[0].point.y, 0.5);
  assert.deepEqual(plain(f.camera.focusPoint.value), { x: 75, y: 50 });
  f.camera.setZoom(0.5);
  await f.camera.focusAt({ clientX: 190, clientY: 30 });
  assert.equal(f.focusCalls.length, 1);
  for (const result of ["auto", "unsupported"]) {
    f.focusResult = result;
    await f.camera.focusAt();
    assert.equal(f.camera.focusPoint.value, null);
    assert.ok(f.camera.focusMessage.value);
    assert.equal(f.camera.active.value, true);
  }
  const pending = deferred();
  f.focusResult = pending.promise;
  const work = f.camera.focusAt();
  f.camera.stop();
  pending.resolve("point");
  await work;
  assert.equal(f.camera.focusPoint.value, null);
  assert.equal(f.camera.focusMessage.value, "");
  f.unmount();
});

test("focus commands are single-flight and stale completion cannot unlock a new session", async () => {
  const f = setup();
  await f.camera.start();
  const first = deferred();
  f.focusResult = first.promise;
  const oldFocus = f.camera.focusAt();
  void f.camera.focusAt();
  assert.equal(f.focusCalls.length, 1);
  await f.camera.start();
  const second = deferred();
  f.focusResult = second.promise;
  const newFocus = f.camera.focusAt();
  assert.equal(f.focusCalls.length, 2);
  first.resolve("point");
  await oldFocus;
  void f.camera.focusAt();
  assert.equal(f.focusCalls.length, 2);
  second.resolve("point");
  await newFocus;
  f.focusResult = "point";
  await f.camera.focusAt();
  assert.equal(f.focusCalls.length, 3);
  f.unmount();
});

test("single scan stops camera; file consensus and late file guard unchanged", async () => {
  const f = setup({ continuous: false });
  await f.camera.start();
  await f.frame(120, ["12345678"]);
  await f.frame(240, ["12345678"]);
  assert.equal(f.camera.active.value, false);
  assert.equal(f.stopped, 1);
  f.unmount();
  const g = setup();
  await g.camera.start();
  await g.frame(120, ["12345678"]);
  assert.equal(await g.camera.scanFile({}), "12345678");
  assert.equal(g.reads.at(-2)[2], "LocalAverage");
  assert.equal(g.reads.at(-1)[2], "GlobalHistogram");
  g.unmount();
  const h = setup();
  await h.camera.start();
  const deferredRead = deferred();
  await h.frame(120, deferredRead.promise);
  const fileRead = h.camera.scanFile({});
  h.camera.stop();
  deferredRead.resolve(["12345678"]);
  assert.equal(await fileRead, null);
  assert.equal(h.detections.length, 0);
  h.unmount();
});

test("scanner template wires accessible zoom, intrinsic resize and focus without changing feedback", () => {
  const source = readFileSync(
    new URL(
      "../src/views/Products/components/ProductBarcodeScanner.vue",
      import.meta.url,
    ),
    "utf8",
  );
  for (const pattern of [
    /ref="viewport"/,
    /:style="camera.previewStyle.value"/,
    /@resize="camera.updateFrame"/,
    /min="0.5"/,
    /max="3"/,
    /@pointerdown="camera.focusAt"/,
    /@keydown.enter.prevent="camera.focusAt\(\)"/,
    /navigator.vibrate/,
    /oscillator.start\(\)/,
  ])
    assert.match(source, pattern);
  assert.match(source, /object-fit: contain/);
  assert.doesNotMatch(source, /object-fit: cover/);
});

test("calculateSkuRawPrice computes unrounded price for weighted and piece SKUs", async () => {
  const { calculateSkuRawPrice } = await import(
    "../src/views/WarehousedGoods/pricing.ts"
  );
  // Piece item unrounded price: 569k * 1.7 + 20k + 30k = 1017.3k
  const pieceRaw = calculateSkuRawPrice({
    pricingType: "Đồ món",
    importPrice: 569000,
    platingCost: 20000,
    laborCost: 30000,
  });
  assert.equal(pieceRaw, 1017300);

  // Weighted item unrounded price: silverCost = 1.6 * 220000 = 352000 (markup 50% -> basePrice 528000) + 200k + 30k = 758000
  const weightedRaw = calculateSkuRawPrice(
    {
      pricingType: "Đồ cân",
      weight: 1.6,
      laborCost: 200000,
      platingCost: 30000,
    },
    220000,
  );
  assert.equal(weightedRaw, 758000);

  const salesCartSource = readFileSync(
    new URL(
      "../src/views/Orders/components/SalesCart.vue",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(salesCartSource, /Tạm tính \(chưa làm tròn\):/);
  assert.match(salesCartSource, /line\.rawPrice/);

  const scannerSource = readFileSync(
    new URL(
      "../src/views/Products/components/ProductBarcodeScanner.vue",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(scannerSource, /Tạm tính \(chưa làm tròn\)/);
  assert.match(scannerSource, /lastProduct\.rawPrice/);
});

