import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { vi } from "vitest";

const decoder = vi.hoisted(() => ({ read: vi.fn() }));

vi.mock("@/views/Products/scanner/zxing-reader", () => ({
  readBarcodeValues: decoder.read,
}));

import {
  barcodeGuideSourceRegion,
  useBarcodeCamera,
  type BarcodeCameraError,
} from "@/views/Products/scanner/useBarcodeCamera";

function streamWith(track: MediaStreamTrack): MediaStream {
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
}

function mountCamera(callbacks: {
  onDetected?: (barcode: string) => void;
  onUnsupported?: (value: string) => void;
  onInterrupted?: () => void;
  onError?: (error: BarcodeCameraError) => void;
} = {}) {
  return mount(
    defineComponent({
      setup(_, { expose }) {
        const video = ref<HTMLVideoElement | null>(null);
        const camera = useBarcodeCamera({
          video,
          onDetected: callbacks.onDetected || vi.fn(),
          onUnsupported: callbacks.onUnsupported,
          onInterrupted: callbacks.onInterrupted,
          onError: callbacks.onError || vi.fn(),
        });
        expose({ camera, video });
        return () => h("video", { ref: video });
      },
    }),
  );
}

describe("useBarcodeCamera", () => {
  beforeEach(() => {
    decoder.read.mockReset();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(),
        width: 1,
        height: 1,
      })),
    } as never);
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: vi.fn(() => 1),
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps the visible square guide back to the landscape camera source", () => {
    expect(barcodeGuideSourceRegion(1920, 1080, 400, 400)).toEqual({
      x: 474,
      y: 297,
      width: 972,
      height: 486,
    });
  });

  it("falls back only after an over-constrained camera request", async () => {
    const track = {
      stop: vi.fn(),
      getCapabilities: vi.fn(() => ({})),
      applyConstraints: vi.fn(),
    } as unknown as MediaStreamTrack;
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error("too strict"), {
          name: "OverconstrainedError",
        }),
      )
      .mockResolvedValueOnce(streamWith(track));
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    const wrapper = mountCamera();
    const camera = (wrapper.vm as never as { camera: ReturnType<typeof useBarcodeCamera> })
      .camera;

    await camera.start();

    expect(getUserMedia).toHaveBeenNthCalledWith(1, {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
    expect(getUserMedia).toHaveBeenNthCalledWith(2, {
      audio: false,
      video: { facingMode: "environment" },
    });
    expect(camera.active.value).toBe(true);

    wrapper.unmount();
    expect(track.stop).toHaveBeenCalledOnce();
  });

  it("does not reactivate a stopped session after focus configuration resolves", async () => {
    let resolveFocus!: () => void;
    const focus = new Promise<void>((resolve) => {
      resolveFocus = resolve;
    });
    const track = {
      stop: vi.fn(),
      getCapabilities: vi.fn(() => ({ focusMode: ["continuous"] })),
      applyConstraints: vi.fn(() => focus),
    } as unknown as MediaStreamTrack;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(streamWith(track)) },
    });
    const wrapper = mountCamera();
    const camera = (wrapper.vm as never as { camera: ReturnType<typeof useBarcodeCamera> })
      .camera;

    const starting = camera.start();
    await flushPromises();
    expect(track.applyConstraints).toHaveBeenCalledOnce();
    camera.stop();
    resolveFocus();
    await starting;

    expect(camera.active.value).toBe(false);
    expect(track.stop).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it("ignores a torch result from a stopped camera session", async () => {
    let resolveOldTorch!: () => void;
    const oldTorch = new Promise<void>((resolve) => {
      resolveOldTorch = resolve;
    });
    const oldTrack = {
      stop: vi.fn(),
      getCapabilities: vi.fn(() => ({ torch: true })),
      applyConstraints: vi.fn(() => oldTorch),
    } as unknown as MediaStreamTrack;
    const newTrack = {
      stop: vi.fn(),
      getCapabilities: vi.fn(() => ({ torch: true })),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
    } as unknown as MediaStreamTrack;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi
          .fn()
          .mockResolvedValueOnce(streamWith(oldTrack))
          .mockResolvedValueOnce(streamWith(newTrack)),
      },
    });
    const wrapper = mountCamera();
    const camera = (wrapper.vm as never as {
      camera: ReturnType<typeof useBarcodeCamera>;
    }).camera;

    await camera.start();
    const toggling = camera.toggleTorch();
    camera.stop();
    await camera.start();
    resolveOldTorch();
    await toggling;

    expect(camera.active.value).toBe(true);
    expect(camera.torchAvailable.value).toBe(true);
    expect(camera.torchEnabled.value).toBe(false);
    wrapper.unmount();
  });

  it("invalidates pending camera startup when the page becomes hidden", async () => {
    let resolveCamera!: (stream: MediaStream) => void;
    const track = {
      stop: vi.fn(),
      getCapabilities: vi.fn(() => ({})),
      applyConstraints: vi.fn(),
    } as unknown as MediaStreamTrack;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(
          () =>
            new Promise<MediaStream>((resolve) => {
              resolveCamera = resolve;
            }),
        ),
      },
    });
    const onInterrupted = vi.fn();
    const wrapper = mountCamera({ onInterrupted });
    const camera = (wrapper.vm as never as { camera: ReturnType<typeof useBarcodeCamera> })
      .camera;

    const starting = camera.start();
    await flushPromises();
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    resolveCamera(streamWith(track));
    await starting;

    expect(camera.active.value).toBe(false);
    expect(track.stop).toHaveBeenCalledOnce();
    expect(onInterrupted).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it("uses four fast ROI passes, then one full-frame recovery without overlap", async () => {
    let scheduled: FrameRequestCallback | undefined;
    let frameId = 0;
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: vi.fn((callback: FrameRequestCallback) => {
        scheduled = callback;
        frameId += 1;
        return frameId;
      }),
    });
    let resolveFirst!: (values: string[]) => void;
    decoder.read
      .mockReturnValueOnce(
        new Promise<string[]>((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValue([]);
    const track = {
      stop: vi.fn(),
      getCapabilities: vi.fn(() => ({})),
      applyConstraints: vi.fn(),
    } as unknown as MediaStreamTrack;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(streamWith(track)) },
    });
    const wrapper = mountCamera();
    const exposed = wrapper.vm as never as {
      camera: ReturnType<typeof useBarcodeCamera>;
      video: HTMLVideoElement;
    };
    Object.defineProperties(exposed.video, {
      videoWidth: { configurable: true, value: 1920 },
      videoHeight: { configurable: true, value: 1080 },
      clientWidth: { configurable: true, value: 400 },
      clientHeight: { configurable: true, value: 400 },
      readyState: {
        configurable: true,
        value: HTMLMediaElement.HAVE_CURRENT_DATA,
      },
    });

    await exposed.camera.start();
    scheduled?.(120);
    scheduled?.(240);
    expect(decoder.read).toHaveBeenCalledOnce();
    resolveFirst([]);
    await flushPromises();

    for (const time of [360, 480, 600, 720]) {
      scheduled?.(time);
      await flushPromises();
    }

    expect(decoder.read.mock.calls.map((call) => call[1])).toEqual([
      "fast",
      "fast",
      "fast",
      "fast",
      "recovery",
    ]);
    wrapper.unmount();
  });

  it("ignores a stale file decode after the scanner session is stopped", async () => {
    let resolveDecode!: (values: string[]) => void;
    decoder.read.mockReturnValueOnce(
      new Promise<string[]>((resolve) => {
        resolveDecode = resolve;
      }),
    );
    const onUnsupported = vi.fn();
    const onError = vi.fn();
    const wrapper = mountCamera({ onUnsupported, onError });
    const camera = (wrapper.vm as never as { camera: ReturnType<typeof useBarcodeCamera> })
      .camera;

    const scanning = camera.scanFile(new File(["label"], "label.jpg"));
    await flushPromises();
    camera.stop();
    resolveDecode(["10000000"]);

    await expect(scanning).resolves.toBeNull();
    expect(decoder.read).toHaveBeenCalledOnce();
    expect(onUnsupported).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("accepts a file barcode only when both local binarizers agree exactly", async () => {
    decoder.read
      .mockResolvedValueOnce(["10000000"])
      .mockResolvedValueOnce(["10000000"]);
    const wrapper = mountCamera();
    const camera = (wrapper.vm as never as { camera: ReturnType<typeof useBarcodeCamera> })
      .camera;
    const file = new File(["label"], "label.jpg");

    await expect(camera.scanFile(file)).resolves.toBe("10000000");
    expect(decoder.read.mock.calls).toEqual([
      [file, "recovery", "LocalAverage"],
      [file, "recovery", "GlobalHistogram"],
    ]);
    wrapper.unmount();
  });
});
