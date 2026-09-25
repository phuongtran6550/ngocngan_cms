import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadEnvironmentCamera(mockNavigator, mockWindow = {}) {
  const source = readFileSync(
    new URL("../src/components/media/environment-camera.ts", import.meta.url),
    "utf8",
  );
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const sandbox = {
    navigator: mockNavigator,
    window: mockWindow,
    MediaStream: class MediaStream {},
    DOMException: class DOMException extends Error {},
    RangeError,
    Math,
    Object,
    Array,
    String,
    Boolean,
    Number,
    setTimeout,
    clearTimeout,
    console,
    exports: {},
  };

  vm.runInNewContext(
    "(function(exports){" + transpiled + "\n})(exports)",
    sandbox,
  );
  return sandbox.exports;
}

test("isIOS correctly detects iPhone, iPad, iPod and iPadOS desktop mode", () => {
  const iphone = loadEnvironmentCamera({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iPhone",
    maxTouchPoints: 5,
  });
  assert.equal(iphone.isIOS(), true);
  assert.equal(iphone.isAndroid(), false);

  const ipados = loadEnvironmentCamera({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    platform: "MacIntel",
    maxTouchPoints: 5,
  });
  assert.equal(ipados.isIOS(), true);
  assert.equal(ipados.isAndroid(), false);

  const samsung = loadEnvironmentCamera({
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Linux armv8l",
    maxTouchPoints: 5,
  });
  assert.equal(samsung.isIOS(), false);
  assert.equal(samsung.isAndroid(), true);

  const oppo = loadEnvironmentCamera({
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; CPH2451) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
    platform: "Linux aarch64",
    maxTouchPoints: 5,
  });
  assert.equal(oppo.isIOS(), false);
  assert.equal(oppo.isAndroid(), true);
});

test("getBestEnvironmentCameraDeviceId returns undefined on iOS to let WebKit virtual camera manage 1x FOV", async () => {
  const mod = loadEnvironmentCamera({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    platform: "iPhone",
    maxTouchPoints: 5,
    mediaDevices: {
      enumerateDevices: async () => [
        { kind: "videoinput", deviceId: "tele-1", label: "Back Telephoto Camera" },
        { kind: "videoinput", deviceId: "main-1", label: "Back Camera" },
        { kind: "videoinput", deviceId: "ultra-1", label: "Back Ultra Wide Camera" },
      ],
    },
  });

  const bestId = await mod.getBestEnvironmentCameraDeviceId();
  assert.equal(bestId, undefined);
});

test("getBestEnvironmentCameraDeviceId on Android selects main camera and filters out telephoto/macro/ultrawide", async () => {
  const mod = loadEnvironmentCamera({
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Linux armv8l",
    maxTouchPoints: 5,
    mediaDevices: {
      enumerateDevices: async () => [
        { kind: "videoinput", deviceId: "tele-id", label: "camera2 2, facing back (telephoto)" },
        { kind: "videoinput", deviceId: "main-id", label: "camera2 0, facing back (main wide)" },
        { kind: "videoinput", deviceId: "ultra-id", label: "camera2 1, facing back (ultra wide)" },
      ],
    },
  });

  const bestId = await mod.getBestEnvironmentCameraDeviceId();
  assert.equal(bestId, "main-id");
});

test("requestEnvironmentCamera uses 1080p landscape without 3:4 crop on iOS (iPhone)", async () => {
  let capturedConstraints = null;
  const mod = loadEnvironmentCamera(
    {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      platform: "iPhone",
      maxTouchPoints: 5,
      mediaDevices: {
        getUserMedia: async (constraints) => {
          capturedConstraints = constraints;
          return {
            getVideoTracks: () => [{}],
            getTracks: () => [],
          };
        },
      },
    },
    { innerWidth: 390, innerHeight: 844 }, // portrait mode on iPhone
  );

  await mod.requestEnvironmentCamera();
  assert.ok(capturedConstraints);
  assert.equal(capturedConstraints.video.facingMode.ideal, "environment");
  assert.equal(capturedConstraints.video.width.ideal, 1920);
  assert.equal(capturedConstraints.video.height.ideal, 1080);
  assert.equal(capturedConstraints.video.aspectRatio, undefined); // No 3:4 crop!
});

test("requestEnvironmentCamera uses orientation-adaptive 3:4 constraints on Android (Samsung/Oppo)", async () => {
  let capturedConstraints = null;
  const mod = loadEnvironmentCamera(
    {
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      platform: "Linux armv8l",
      maxTouchPoints: 5,
      mediaDevices: {
        enumerateDevices: async () => [
          { kind: "videoinput", deviceId: "front-cam", label: "camera2 1, facing front" },
          { kind: "videoinput", deviceId: "samsung-wide", label: "camera2 0, facing back" },
        ],
        getUserMedia: async (constraints) => {
          capturedConstraints = constraints;
          return {
            getVideoTracks: () => [{}],
            getTracks: () => [],
          };
        },
      },
    },
    { innerWidth: 412, innerHeight: 915 }, // portrait mode on Samsung
  );

  await mod.requestEnvironmentCamera();
  assert.ok(capturedConstraints);
  assert.equal(capturedConstraints.video.deviceId.exact, "samsung-wide");
  assert.equal(capturedConstraints.video.width.ideal, 1080);
  assert.equal(capturedConstraints.video.height.ideal, 1920);
  assert.equal(capturedConstraints.video.aspectRatio.ideal, 0.75);
});

test("prepareEnvironmentCameraTrack resets hardware zoom on Android but skips on iOS", async () => {
  // Test Android: resets zoom
  let androidZoomConstraint = null;
  const androidTrack = {
    getCapabilities: () => ({
      zoom: { min: 1, max: 10 },
      focusMode: ["continuous"],
    }),
    applyConstraints: async (c) => {
      if (c?.advanced?.[0]?.zoom !== undefined) {
        androidZoomConstraint = c.advanced[0].zoom;
      }
    },
  };
  const androidMod = loadEnvironmentCamera({
    userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile",
    platform: "Linux armv8l",
  });
  await androidMod.prepareEnvironmentCameraTrack(androidTrack);
  assert.equal(androidZoomConstraint, 1);

  // Test iOS: does NOT force zoom constraint
  let iosZoomConstraint = null;
  const iosTrack = {
    getCapabilities: () => ({
      zoom: { min: 1, max: 10 },
      focusMode: ["continuous"],
    }),
    applyConstraints: async (c) => {
      if (c?.advanced?.[0]?.zoom !== undefined) {
        iosZoomConstraint = c.advanced[0].zoom;
      }
    },
  };
  const iosMod = loadEnvironmentCamera({
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    platform: "iPhone",
  });
  await iosMod.prepareEnvironmentCameraTrack(iosTrack);
  assert.equal(iosZoomConstraint, null);
});
