import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { parse, compileScript } from "@vue/compiler-sfc";
const require = createRequire(import.meta.url),
  vue = require("vue");
const defer = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
function setup() {
  const classes = new Set();
  const observers = [];
  const focusRequests = [];
  const navigator = {
    mediaDevices: {
      getSupportedConstraints: () => ({ pointsOfInterest: true }),
    },
  };
  const mounted = [],
    unmount = [],
    emits = [],
    requests = [],
    draws = [],
    blobs = [],
    events = new Map(),
    props = vue.reactive({ active: true, disabled: false });
  let stopped = 0;
  const stream = {
    getVideoTracks: () => [{ getCapabilities: () => ({}) }],
    getTracks: () => [{ stop: () => stopped++ }],
  };
  const camera = {
    requestEnvironmentCamera: () => {
      const d = defer();
      requests.push(d);
      return d.promise;
    },
    attachEnvironmentCamera: async (v, s) => {
      v.srcObject = s;
    },
    prepareEnvironmentCameraTrack: async () => ({ torchAvailable: true }),
    setEnvironmentCameraTorch: async () => {},
    setEnvironmentCameraFocus: (track, point) => {
      const pending = defer();
      focusRequests.push({ track, point, ...pending });
      return pending.promise;
    },
    stopEnvironmentCamera: (s, v) => {
      s?.getTracks().forEach((t) => t.stop());
      if (v) v.srcObject = null;
    },
    normalizeEnvironmentCameraError: () => ({ code: "permission-denied" }),
  };
  const document = {
    hidden: false,
    body: {
      classList: {
        contains: (n) => classes.has(n),
        add: (n) => classes.add(n),
        remove: (n) => classes.delete(n),
      },
    },
    addEventListener: (n, f) => events.set(n, f),
    removeEventListener: (n) => events.delete(n),
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: (...args) => draws.push(args),
        scale() {},
        transform() {},
      }),
      toBlob: (cb, type, quality) => blobs.push({ cb, type, quality }),
    }),
  };
  const deps = {
    vue: {
      ...vue,
      onMounted: (f) => mounted.push(f),
      onBeforeUnmount: (f) => unmount.push(f),
    },
    "@/components/media/environment-camera": camera,
    "@/components/ui/AppIcon.vue": {},
  };
  const cache = new Map(),
    context = vm.createContext({
      File,
      Blob,
      navigator,
      setTimeout,
      clearTimeout,
      ResizeObserver: class {
        constructor(callback) {
          this.callback = callback;
          observers.push(this);
        }
        observe(target) {
          this.target = target;
        }
        disconnect() {
          this.disconnected = true;
        }
      },
      document,
      window: {
        addEventListener: (n, f) => events.set(n, f),
        removeEventListener: (n) => events.delete(n),
      },
      createImageBitmap: async () => ({
        width: 1920,
        height: 1080,
        close() {},
      }),
    });
  function evaluate(file) {
    let source = readFileSync(new URL("../" + file, import.meta.url), "utf8");
    if (file.endsWith(".vue"))
      source = compileScript(parse(source, { filename: file }).descriptor, {
        id: file,
      }).content;
    const code = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
      module = { exports: {} };
    vm.runInContext(
      "(function(require,module,exports){" + code + "\n})",
      context,
    )(load, module, module.exports);
    return module.exports;
  }
  function load(name) {
    if (name in deps) return deps[name];
    if (!name.startsWith("@/")) return require(name);
    if (!cache.has(name))
      cache.set(name, evaluate("src/" + name.slice(2) + ".ts"));
    return cache.get(name);
  }
  const page = evaluate(
    "src/views/Orders/components/OrderPhotoCapture.vue",
  ).default.setup(props, { expose() {}, emit: (...args) => emits.push(args) });
  page.dialog.value = {
    open: false,
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
    },
  };
  page.video.value = {
    videoWidth: 1920,
    videoHeight: 1080,
    clientWidth: 360,
    clientHeight: 640,
    getBoundingClientRect: () => ({
      left: -860,
      top: -270,
      width: 2160,
      height: 1280,
    }),
  };
  page.viewport.value = {
    clientWidth: 360,
    clientHeight: 640,
    getBoundingClientRect: () => ({
      left: 100,
      top: 50,
      width: 360,
      height: 640,
    }),
  };
  return {
    page,
    props,
    document,
    classes,
    requests,
    draws,
    blobs,
    emits,
    events,
    observers,
    focusRequests,
    navigator,
    evaluate,
    mount: () => mounted.forEach((f) => f()),
    get stopped() {
      return stopped;
    },
    async start() {
      const pending = page.startCamera();
      await new Promise(setImmediate);
      requests.at(-1).resolve(stream);
      await pending;
    },
    unmount() {
      unmount.forEach((f) => f());
    },
  };
}
test("template connects viewport measurement and intrinsic video resize", () => {
  const source = readFileSync(
    new URL(
      "../src/views/Orders/components/OrderPhotoCapture.vue",
      import.meta.url,
    ),
    "utf8",
  );
  const template = parse(source).descriptor.template.content;
  assert.match(
    template,
    /<div\s[^>]*ref="viewport"[^>]*class="order-photo-capture__viewport"/,
  );
  assert.match(template, /<video\s[^>]*@resize="updateFrame"/);
  assert.match(template, /@click="focusPhoto\(\$event\)"/);
  assert.match(template, /@keydown.enter.prevent="focusPhoto\(\)"/);
  assert.match(template, /@keydown.space.prevent="focusPhoto\(\)"/);
});
test("viewport and intrinsic frame resizing update preview; observer disconnected on unmount", async () => {
  const f = setup();
  f.props.active = false;
  await new Promise(setImmediate);
  f.mount();
  assert.equal(f.observers[0].target, f.page.viewport.value);
  f.props.active = true;
  await new Promise(setImmediate);
  f.requests[0].resolve({ getVideoTracks: () => [], getTracks: () => [] });
  await new Promise(setImmediate);
  assert.equal(f.page.minZoom.value, 0.31);
  Object.assign(f.page.viewport.value, { clientWidth: 640, clientHeight: 360 });
  f.observers[0].callback();
  assert.equal(f.page.previewStyle.value.width, "640px");
  assert.equal(f.page.previewStyle.value.height, "360px");
  assert.equal(f.page.minZoom.value, 0.5);
  Object.assign(f.page.video.value, { videoWidth: 1080, videoHeight: 1920 });
  f.page.updateFrame();
  assert.equal(f.page.frame.value.width, 1080);
  assert.equal(f.page.previewStyle.value.width, "640px");
  assert.ok(
    Math.abs(parseFloat(f.page.previewStyle.value.height) - 1137.7777777778) <
      1e-7,
  );
  assert.equal(f.page.minZoom.value, 0.31);
  f.unmount();
  assert.equal(f.observers[0].disconnected, true);
});
test("tap focus maps transformed video coordinates, serializes requests and only marks confirmed point", async () => {
  for (const result of ["point", "auto", "unsupported"]) {
    const f = setup();
    await f.start();
    f.page.zoom.value = 2;
    const pending = f.page.focusPhoto({ clientX: 328, clientY: 242 });
    assert.ok(Math.abs(f.focusRequests[0].point.x - 0.55) < 1e-10);
    assert.equal(f.focusRequests[0].point.y, 0.4);
    await f.page.focusPhoto();
    assert.equal(f.focusRequests.length, 1);
    assert.equal(f.page.focusPoint.value, null);
    f.focusRequests[0].resolve(result);
    await pending;
    if (result === "point") {
      assert.equal(f.page.focusPoint.value.x, 228);
      assert.equal(f.page.focusPoint.value.y, 192);
    } else assert.equal(f.page.focusPoint.value, null);
    assert.ok(f.page.focusMessage.value);
    f.unmount();
  }
});
test("black border ignored, keyboard focuses center, stale and failed focus never marks success", async () => {
  const f = setup();
  await f.start();
  f.page.video.value.getBoundingClientRect = () => ({
    left: 100,
    top: 200,
    width: 360,
    height: 202.5,
  });
  await f.page.focusPhoto({ clientX: 200, clientY: 100 });
  assert.equal(f.focusRequests.length, 0);
  const keyboard = f.page.focusPhoto();
  assert.equal(f.focusRequests[0].point.x, 0.5);
  assert.equal(f.focusRequests[0].point.y, 0.5);
  f.focusRequests[0].reject(new Error("device rejected"));
  await keyboard;
  assert.equal(f.page.focusPoint.value, null);
  const stale = f.page.focusPhoto();
  f.unmount();
  f.focusRequests[1].resolve("point");
  await stale;
  assert.equal(f.page.focusPoint.value, null);
  assert.equal(f.page.focusMessage.value, "");
});
test("shared focus helper confirms applied settings and degrades when device ignores or rejects constraints", async () => {
  const f = setup(),
    { setEnvironmentCameraFocus: focus } = f.evaluate(
      "src/components/media/environment-camera.ts",
    );
  const point = { x: 0.25, y: 0.75 };
  for (const outcome of [
    "point",
    "auto",
    "ignored",
    "reject",
    "no-capability",
  ]) {
    const applied = [];
    let settings = {};
    const track = {
      getCapabilities: () => ({
        focusMode: outcome === "no-capability" ? [] : ["continuous"],
      }),
      getSettings: () => settings,
      applyConstraints: async (value) => {
        applied.push(value);
        if (outcome === "reject") throw new Error("unsupported");
        if (outcome === "point") settings = value.advanced[0];
        if (outcome === "auto") settings = { focusMode: "continuous" };
      },
    };
    assert.equal(
      await focus(track, point),
      outcome === "point"
        ? "point"
        : outcome === "auto"
          ? "auto"
          : "unsupported",
    );
    if (outcome === "no-capability") assert.equal(applied.length, 0);
    else assert.equal(applied[0].advanced[0].pointsOfInterest[0], point);
    for (const invalid of [
      { x: NaN, y: 0 },
      { x: -0.1, y: 0.5 },
      { x: 0.5, y: 1.1 },
    ]) {
      const count = applied.length;
      await assert.rejects(focus(track, invalid), { name: "RangeError" });
      assert.equal(applied.length, count);
    }
  }
  assert.equal(
    await focus(
      {
        getCapabilities() {
          throw new Error("not supported");
        },
      },
      point,
    ),
    "unsupported",
  );
  f.navigator.mediaDevices.getSupportedConstraints = () => ({});
  const automatic = [];
  assert.equal(
    await focus(
      {
        getCapabilities: () => ({ focusMode: ["single-shot"] }),
        getSettings: () => ({ focusMode: "single-shot" }),
        applyConstraints: async (value) => automatic.push(value),
      },
      point,
    ),
    "auto",
  );
  assert.equal(automatic.length, 1);
  assert.equal(automatic[0].advanced[0].pointsOfInterest, undefined);
  f.unmount();
});
test("focus helper preserves torch and resolution and replaces the previous point", async () => {
  const f = setup(),
    { setEnvironmentCameraFocus: focus } = f.evaluate(
      "src/components/media/environment-camera.ts",
    );
  let constraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    advanced: [
      {
        torch: true,
        focusMode: "continuous",
        pointsOfInterest: [{ x: 0.1, y: 0.1 }],
      },
    ],
  };
  const original = JSON.stringify(constraints);
  const previous = constraints;
  const track = {
    getCapabilities: () => ({ focusMode: ["continuous"] }),
    getConstraints: () => constraints,
    getSettings: () => constraints.advanced[0],
    applyConstraints: async (value) => {
      constraints = value;
    },
  };
  for (const point of [
    { x: 0.25, y: 0.75 },
    { x: 0.7, y: 0.3 },
  ]) {
    assert.equal(await focus(track, point), "point");
    assert.equal(constraints.width.ideal, 1920);
    assert.equal(constraints.height.ideal, 1080);
    assert.equal(constraints.advanced[0].torch, true);
    assert.equal(constraints.advanced[0].pointsOfInterest.length, 1);
    assert.equal(constraints.advanced[0].pointsOfInterest[0], point);
  }
  assert.equal(JSON.stringify(previous), original);
  f.navigator.mediaDevices.getSupportedConstraints = () => ({});
  assert.equal(await focus(track, { x: 0.5, y: 0.5 }), "auto");
  assert.equal(constraints.advanced[0].torch, true);
  assert.equal(constraints.advanced[0].pointsOfInterest, undefined);
  f.unmount();
});
test("zoom change invalidates in-flight focus feedback", async () => {
  const f = setup();
  await f.start();
  const pending = f.page.focusPhoto();
  f.page.zoom.value = 0.5;
  await new Promise(setImmediate);
  f.focusRequests[0].resolve("point");
  await pending;
  assert.equal(f.page.focusPoint.value, null);
  assert.equal(f.page.focusMessage.value, "");
  const next = f.page.focusPhoto();
  assert.equal(f.focusRequests.length, 2);
  f.focusRequests[1].resolve("auto");
  await next;
  f.unmount();
});
test("capture during pending focus emits once and clears feedback when stream stops", async () => {
  const f = setup();
  await f.start();
  const focus = f.page.focusPhoto(),
    capture = f.page.capturePhoto();
  assert.equal(f.page.state.value, "capturing");
  f.focusRequests[0].resolve("point");
  await focus;
  assert.equal(f.emits.length, 0);
  f.blobs[0].cb(new Blob(["photo"], { type: "image/jpeg" }));
  await capture;
  assert.equal(f.emits.length, 1);
  assert.equal(f.stopped, 1);
  assert.equal(f.page.focusPoint.value, null);
  assert.equal(f.page.focusMessage.value, "");
  f.unmount();
});
test("capture JPEG quality0.84; maximum1600; stop camera before emit", async () => {
  const f = setup();
  await f.start();
  assert.equal(f.page.state.value, "ready");
  const capture = f.page.capturePhoto();
  assert.ok(Math.max(...f.draws[0].slice(-2)) <= 1600);
  assert.equal(f.blobs[0].type, "image/jpeg");
  assert.equal(f.blobs[0].quality, 0.84);
  f.blobs[0].cb(new Blob(["photo"], { type: "image/jpeg" }));
  await capture;
  assert.equal(f.stopped, 1);
  assert.equal(f.emits[0][0], "captured");
  assert.equal(f.emits[0][1].type, "image/jpeg");
  assert.equal(f.page.state.value, "idle");
  f.unmount();
});
test("late getUserMedia after unmount stops returned stream and emits nothing", async () => {
  const f = setup();
  const pending = f.page.startCamera();
  await new Promise(setImmediate);
  f.unmount();
  f.requests[0].resolve({
    getTracks: () => [
      {
        stop() {
          f.document.staleStopped = true;
        },
      },
    ],
  });
  await pending;
  assert.equal(f.document.staleStopped, true);
  assert.equal(f.emits.length, 0);
});
test("late toBlob result after deactivation cannot emit", async () => {
  const f = setup();
  await f.start();
  const pending = f.page.capturePhoto();
  f.props.active = false;
  await new Promise(setImmediate);
  f.blobs[0].cb(new Blob(["photo"], { type: "image/jpeg" }));
  await pending;
  assert.equal(f.emits.length, 0);
  assert.equal(f.stopped, 1);
  f.unmount();
});
test("disabled and zero video dimensions suppress capture", async () => {
  const f = setup();
  await f.start();
  f.props.disabled = true;
  await f.page.capturePhoto();
  assert.equal(f.blobs.length, 0);
  f.props.disabled = false;
  f.page.video.value.videoWidth = 0;
  await f.page.capturePhoto();
  assert.equal(f.blobs.length, 0);
  f.unmount();
});
test("invalid picker file stops camera; resets input; preserves recoverable error", async () => {
  const f = setup();
  await f.start();
  const input = {
    files: [new File(["text"], "bad.txt", { type: "text/plain" })],
    value: "chosen",
  };
  await f.page.selectFile({ target: input });
  assert.equal(input.value, "");
  assert.equal(f.stopped, 1);
  assert.equal(f.page.state.value, "idle");
  assert.ok(f.page.localError.value);
  assert.equal(f.emits.length, 0);
  f.unmount();
});
test("centered crop matches portrait, landscape and equal-aspect at full-frame, .5x, 1x, 2x, 3x", async () => {
  for (const [width, height, viewWidth, viewHeight, baseWidth, baseHeight] of [
    [1920, 1080, 360, 640, 607.5, 1080],
    [1080, 1920, 640, 360, 1080, 607.5],
    [3200, 1800, 640, 360, 3200, 1800],
  ]) {
    for (const zoom of ["full", 0.5, 1, 2, 3]) {
      const f = setup();
      Object.assign(f.page.video.value, {
        videoWidth: width,
        videoHeight: height,
        clientWidth: viewWidth,
        clientHeight: viewHeight,
      });
      Object.assign(f.page.viewport.value, {
        clientWidth: viewWidth,
        clientHeight: viewHeight,
      });
      await f.start();
      f.page.zoom.value = zoom === "full" ? f.page.minZoom.value : zoom;
      const capture = f.page.capturePhoto(),
        args = f.draws[0],
        cropWidth = zoom === "full" ? width : Math.min(width, baseWidth / zoom),
        cropHeight =
          zoom === "full" ? height : Math.min(height, baseHeight / zoom);
      for (const [actual, expected] of [
        [args[1], (width - cropWidth) / 2],
        [args[2], (height - cropHeight) / 2],
        [args[3], cropWidth],
        [args[4], cropHeight],
      ])
        assert.ok(Math.abs(actual - expected) < 1e-8);
      assert.ok(Math.max(args[7], args[8]) <= 1600);
      assert.ok(args[7] <= Math.ceil(cropWidth));
      assert.ok(args[8] <= Math.ceil(cropHeight));
      f.blobs[0].cb(new Blob(["photo"], { type: "image/jpeg" }));
      await capture;
      assert.equal(
        Boolean(f.emits[0][2]),
        Math.max(cropWidth, cropHeight) < 1280,
      );
      f.unmount();
    }
  }
});
test("zoom clamped to full-frame minimum and3, disabled during capture, reset on restart", async () => {
  const f = setup();
  await f.start();
  f.page.changeZoom(9);
  assert.equal(f.page.zoom.value, 3);
  f.page.changeZoom(-9);
  assert.equal(f.page.zoom.value, 0.31);
  f.page.changeZoom(0.25);
  assert.equal(f.page.zoom.value, 0.56);
  f.props.disabled = true;
  f.page.changeZoom(0.25);
  assert.equal(f.page.zoom.value, 0.56);
  f.props.disabled = false;
  const capture = f.page.capturePhoto();
  f.page.changeZoom(0.25);
  assert.equal(f.page.zoom.value, 0.56);
  f.blobs[0].cb(new Blob(["photo"], { type: "image/jpeg" }));
  await capture;
  await f.start();
  assert.equal(f.page.zoom.value, 1);
  f.unmount();
});
test("dialog opens, Escape honors disabled, deactivation/unmount restore scroll and release camera", async () => {
  const f = setup();
  f.mount();
  await new Promise(setImmediate);
  f.requests[0].resolve({ getVideoTracks: () => [], getTracks: () => [] });
  await new Promise(setImmediate);
  assert.equal(f.page.dialog.value.open, true);
  assert.ok(f.classes.has("modal-open"));
  const event = { key: "Escape", preventDefault() {} };
  f.props.disabled = true;
  f.events.get("keydown")(event);
  assert.equal(f.emits.length, 0);
  f.props.disabled = false;
  f.events.get("keydown")(event);
  assert.equal(f.emits[0][0], "back");
  f.props.active = false;
  await new Promise(setImmediate);
  assert.equal(f.page.dialog.value.open, false);
  assert.equal(f.classes.has("modal-open"), false);
  assert.equal(f.events.has("keydown"), false);
  f.unmount();
  assert.equal(f.events.size, 0);
  const active = setup();
  active.page.syncDialog(true);
  await active.start();
  active.unmount();
  assert.equal(active.stopped, 1);
  assert.equal(active.page.dialog.value.open, false);
  assert.equal(active.classes.has("modal-open"), false);
});
test("valid selected image uses existing optimizer and ignores result after unmount", async () => {
  for (const stale of [false, true]) {
    const f = setup();
    await f.start();
    const pending = f.page.selectFile({
      target: {
        files: [new File(["photo"], "image.jpg", { type: "image/jpeg" })],
        value: "chosen",
      },
    });
    await new Promise(setImmediate);
    assert.equal(f.stopped, 1);
    assert.equal(f.blobs[0].quality, 0.84);
    assert.equal(f.blobs[0].type, "image/jpeg");
    if (stale) f.unmount();
    f.blobs[0].cb(new Blob(["jpeg"], { type: "image/jpeg" }));
    await pending;
    assert.equal(f.emits.length, stale ? 0 : 1);
    if (!stale) {
      assert.equal(f.emits[0][1].type, "image/jpeg");
      f.unmount();
    }
  }
});
