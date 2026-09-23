import { computed, onBeforeUnmount, readonly, ref, type Ref } from "vue";
import {
  attachEnvironmentCamera,
  listEnvironmentCameraDevices,
  normalizeEnvironmentCameraError,
  prepareEnvironmentCameraTrack,
  requestEnvironmentCamera,
  setEnvironmentCameraFocus,
  setEnvironmentCameraTorch,
  stopEnvironmentCamera,
} from "@/components/media/environment-camera";
import { isInventoryBarcode } from "@/utils/inventory-barcode";
import { BarcodeCandidateStabilizer } from "@/views/Products/scanner/barcode-candidate";
import {
  isNativeBarcodeDetectorSupported,
  readBarcodeValues,
  type BarcodeDecodeMode,
} from "@/views/Products/scanner/zxing-reader";

const DECODE_INTERVAL_MS = 120;
const FULL_FRAME_INTERVAL = 5;
const MAX_DECODE_EDGE = 1_280;
const GUIDE_WIDTH_RATIO = 0.9;
const GUIDE_HEIGHT_RATIO = 0.45;

export type BarcodeCameraErrorCode =
  "unsupported" | "permission-denied" | "no-camera" | "camera" | "decoder";

export interface BarcodeCameraError {
  code: BarcodeCameraErrorCode;
  message: string;
  cause?: unknown;
}

interface BarcodeCameraOptions {
  video: Ref<HTMLVideoElement | null>;
  viewport?: Ref<HTMLElement | null>;
  onDetected(barcode: string): void;
  onUnsupported?(value: string): void;
  onInterrupted?(): void;
  onError(error: BarcodeCameraError): void;
  continuous?: boolean;
}

export interface BarcodeSourceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function barcodeGuideSourceRegion(
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  zoom = 1,
  fullViewport = false,
): BarcodeSourceRegion {
  const safeViewportWidth = viewportWidth > 0 ? viewportWidth : 1;
  const safeViewportHeight = viewportHeight > 0 ? viewportHeight : 1;
  const coverScale =
    Math.max(
      safeViewportWidth / sourceWidth,
      safeViewportHeight / sourceHeight,
    ) * zoom;
  const renderedWidth = sourceWidth * coverScale;
  const renderedHeight = sourceHeight * coverScale;
  const cropX = (renderedWidth - safeViewportWidth) / 2;
  const cropY = (renderedHeight - safeViewportHeight) / 2;
  const guideWidth = safeViewportWidth * (fullViewport ? 1 : GUIDE_WIDTH_RATIO);
  const guideHeight =
    safeViewportHeight * (fullViewport ? 1 : GUIDE_HEIGHT_RATIO);
  const guideX = (safeViewportWidth - guideWidth) / 2;
  const guideY = (safeViewportHeight - guideHeight) / 2;
  const left = Math.round((guideX + cropX) / coverScale);
  const top = Math.round((guideY + cropY) / coverScale);
  const x = Math.max(left, 0);
  const y = Math.max(top, 0);

  return {
    x,
    y,
    width: Math.min(
      Math.max(Math.round(guideWidth / coverScale) + Math.min(left, 0), 1),
      sourceWidth - x,
    ),
    height: Math.min(
      Math.max(Math.round(guideHeight / coverScale) + Math.min(top, 0), 1),
      sourceHeight - y,
    ),
  };
}

export function useBarcodeCamera(options: BarcodeCameraOptions) {
  const zoom = ref(1);
  const focusMessage = ref("");
  const focusPoint = ref<{ x: number; y: number } | null>(null);
  const sourceAspect = ref(1);
  const previewStyle = computed(() => ({
    width: `${Math.max(1, sourceAspect.value) * zoom.value * 100}%`,
    height: `${Math.max(1, 1 / sourceAspect.value) * zoom.value * 100}%`,
  }));
  const torchAvailable = ref(false);
  const torchEnabled = ref(false);
  const active = ref(false);
  const stabilizer = new BarcodeCandidateStabilizer();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  let stream: MediaStream | null = null;
  let track: MediaStreamTrack | null = null;
  let frameRequest = 0;
  let lastDecodeAt = 0;
  let framePass = 0;
  let decoding = false;
  let starting = false;
  let fileScanning = false;
  let sessionId = 0;
  let disposed = false;
  let paused = false;
  let blockedBarcode = "";
  let frameVersion = 0;
  let focusRequestId = 0;
  let focusBusy = false;

  function updateFrame(): void {
    const video = options.video.value;
    if (video?.videoWidth && video.videoHeight) {
      sourceAspect.value = video.videoWidth / video.videoHeight;
      frameVersion += 1;
      focusPoint.value = null;
      focusMessage.value = "";
      stabilizer.reset();
    }
  }

  function setZoom(value: number): void {
    if (!active.value || !Number.isFinite(value)) return;
    zoom.value = Math.min(3, Math.max(0.5, Math.round(value * 100) / 100));
    frameVersion += 1;
    focusPoint.value = null;
    focusMessage.value = "";
    stabilizer.reset();
  }

  function stop(): void {
    sessionId += 1;
    if (frameRequest) cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    decoding = false;
    lastDecodeAt = 0;
    framePass = 0;
    starting = false;
    fileScanning = false;
    stabilizer.reset();
    paused = false;
    blockedBarcode = "";
    zoom.value = 1;
    focusRequestId += 1;
    focusBusy = false;
    focusPoint.value = null;
    focusMessage.value = "";
    stopEnvironmentCamera(stream, options.video.value);
    stream = null;
    track = null;
    active.value = false;
    torchAvailable.value = false;
    torchEnabled.value = false;
    canvas.width = 0;
    canvas.height = 0;
  }

  function captureFrame(
    video: HTMLVideoElement,
    fullFrame: boolean,
  ): ImageData | null {
    if (!context || !video.videoWidth || !video.videoHeight) return null;
    const viewport = options.viewport?.value || video.parentElement || video;
    const viewportWidth = viewport.clientWidth || 1;
    const viewportHeight = viewport.clientHeight || viewportWidth;
    const region =
      fullFrame && zoom.value === 1
        ? {
            x: 0,
            y: 0,
            width: video.videoWidth,
            height: video.videoHeight,
          }
        : barcodeGuideSourceRegion(
            video.videoWidth,
            video.videoHeight,
            viewportWidth,
            viewportHeight,
            zoom.value,
            fullFrame,
          );
    const sourceX = region.x;
    const sourceY = region.y;
    const sourceWidth = region.width;
    const sourceHeight = region.height;
    const scale = Math.min(
      1,
      MAX_DECODE_EDGE / Math.max(sourceWidth, sourceHeight),
    );
    const width = Math.max(Math.round(sourceWidth * scale), 1);
    const height = Math.max(Math.round(sourceHeight * scale), 1);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height,
    );
    return context.getImageData(0, 0, width, height);
  }

  function observe(values: string[], observedAt: number): boolean {
    const barcode = values.find(isInventoryBarcode);
    if (!barcode) {
      stabilizer.reset();
      blockedBarcode = "";
      const unsupported = values.find((value) => value.trim());
      if (unsupported) options.onUnsupported?.(unsupported);
      return false;
    }
    if (options.continuous && barcode === blockedBarcode) return false;
    const accepted = stabilizer.observe(barcode, observedAt);
    if (!accepted) return false;
    if (options.continuous) {
      paused = true;
      blockedBarcode = accepted;
      stabilizer.reset();
    } else {
      stop();
    }
    options.onDetected(accepted);
    return true;
  }

  const availableCameras = ref<MediaDeviceInfo[]>([]);
  const currentCameraIndex = ref(0);
  const canSwitchCamera = computed(() => availableCameras.value.length > 1);

  async function refreshCameras(): Promise<void> {
    if (typeof listEnvironmentCameraDevices === "function") {
      const devices = await listEnvironmentCameraDevices().catch(() => []);
      availableCameras.value = devices;
    }
  }

  async function switchCamera(): Promise<void> {
    if (availableCameras.value.length <= 1) return;
    currentCameraIndex.value =
      (currentCameraIndex.value + 1) % availableCameras.value.length;
    const target = availableCameras.value[currentCameraIndex.value];
    if (target?.deviceId) {
      await start(target.deviceId);
    }
  }

  async function decodeFrame(
    session: number,
    video: HTMLVideoElement,
    mode: BarcodeDecodeMode,
  ): Promise<void> {
    const version = frameVersion;
    const image = captureFrame(video, mode === "recovery");
    if (!image) return;
    try {
      let values = await readBarcodeValues(image, mode);
      if (
        !values.length &&
        typeof isNativeBarcodeDetectorSupported === "function" &&
        isNativeBarcodeDetectorSupported() &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        const fullVideoValues = await readBarcodeValues(video, mode).catch(
          () => [],
        );
        if (fullVideoValues.length) {
          values = fullVideoValues;
        }
      }
      if (session !== sessionId || disposed || version !== frameVersion) return;
      observe(values, performance.now());
    } catch (error) {
      if (session !== sessionId || disposed || version !== frameVersion) return;
      stop();
      options.onError({
        code: "decoder",
        message: "Không thể phân tích khung hình camera.",
        cause: error,
      });
    }
  }

  function schedule(session: number): void {
    const loop = (time: number) => {
      if (session !== sessionId || disposed || !active.value) return;
      frameRequest = requestAnimationFrame(loop);
      if (paused || decoding || time - lastDecodeAt < DECODE_INTERVAL_MS)
        return;
      const video = options.video.value;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA)
        return;
      lastDecodeAt = time;
      framePass += 1;
      decoding = true;
      const mode: BarcodeDecodeMode =
        framePass % FULL_FRAME_INTERVAL === 0 ? "recovery" : "fast";
      void decodeFrame(session, video, mode).finally(() => {
        if (session === sessionId) decoding = false;
      });
    };
    frameRequest = requestAnimationFrame(loop);
  }

  async function configureTrack(videoTrack: MediaStreamTrack): Promise<void> {
    const result = await prepareEnvironmentCameraTrack(videoTrack);
    torchAvailable.value = result.torchAvailable;
  }

  async function start(preferredDeviceId?: string): Promise<void> {
    stop();
    const session = ++sessionId;
    starting = true;
    try {
      const nextStream = await requestEnvironmentCamera(preferredDeviceId);
      if (session !== sessionId || disposed) {
        stopEnvironmentCamera(nextStream);
        return;
      }
      const video = options.video.value;
      if (!video) {
        stopEnvironmentCamera(nextStream);
        throw new Error("Scanner video element is unavailable");
      }
      stream = nextStream;
      track = nextStream.getVideoTracks()[0] || null;
      await attachEnvironmentCamera(video, nextStream);
      if (session !== sessionId || disposed) return;
      if (track) await configureTrack(track);
      if (session !== sessionId || disposed) return;
      starting = false;
      updateFrame();
      active.value = true;
      void refreshCameras();
      schedule(session);
    } catch (error) {
      if (session !== sessionId || disposed) return;
      stop();
      const normalized = normalizeEnvironmentCameraError(error);
      const messages: Record<typeof normalized.code, string> = {
        unsupported: "Trình duyệt này không hỗ trợ quét camera trực tiếp.",
        "permission-denied": "Trình duyệt chưa được cấp quyền sử dụng camera.",
        "no-camera": "Không tìm thấy camera phù hợp trên thiết bị.",
        camera: "Không thể khởi động camera. Vui lòng thử lại.",
      };
      options.onError({
        code: normalized.code,
        message: messages[normalized.code],
        cause: normalized.cause,
      });
    }
  }

  async function scanFile(file: File): Promise<string | null> {
    stop();
    const session = sessionId;
    fileScanning = true;
    try {
      const localAverage = await readBarcodeValues(
        file,
        "recovery",
        "LocalAverage",
      );
      if (session !== sessionId || disposed) return null;
      const globalHistogram = await readBarcodeValues(
        file,
        "recovery",
        "GlobalHistogram",
      );
      if (session !== sessionId || disposed) return null;
      const barcode = localAverage.find(
        (value) => isInventoryBarcode(value) && globalHistogram.includes(value),
      );
      if (barcode) return barcode;
      const unsupported = [...localAverage, ...globalHistogram].find((value) =>
        value.trim(),
      );
      if (unsupported) options.onUnsupported?.(unsupported);
      return null;
    } catch (error) {
      if (session !== sessionId || disposed) return null;
      options.onError({
        code: "decoder",
        message: "Không thể đọc barcode từ ảnh đã chọn.",
        cause: error,
      });
      return null;
    } finally {
      if (session === sessionId) fileScanning = false;
    }
  }

  async function toggleTorch(): Promise<void> {
    if (!track || !torchAvailable.value) return;
    const targetTrack = track;
    const session = sessionId;
    const next = !torchEnabled.value;
    try {
      await setEnvironmentCameraTorch(targetTrack, next);
      if (session !== sessionId || disposed || track !== targetTrack) return;
      torchEnabled.value = next;
    } catch {
      if (session !== sessionId || disposed || track !== targetTrack) return;
      torchAvailable.value = false;
      torchEnabled.value = false;
    }
  }

  async function focusAt(event?: {
    clientX: number;
    clientY: number;
  }): Promise<void> {
    const video = options.video.value;
    const viewport = options.viewport?.value || video?.parentElement;
    if (focusBusy || !active.value || !track || !video || !viewport) return;
    const rendered = video.getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    if (!rendered.width || !rendered.height || !bounds.width || !bounds.height)
      return;
    const clientX = event?.clientX ?? bounds.left + bounds.width / 2;
    const clientY = event?.clientY ?? bounds.top + bounds.height / 2;
    const point = {
      x: (clientX - rendered.left) / rendered.width,
      y: (clientY - rendered.top) / rendered.height,
    };
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
    const session = sessionId;
    const version = frameVersion;
    const request = ++focusRequestId;
    const target = track;
    focusBusy = true;
    focusPoint.value = null;
    focusMessage.value = "Đang yêu cầu camera lấy nét…";
    try {
      const result = await setEnvironmentCameraFocus(target, point).catch(
        () => "unsupported" as const,
      );
      if (
        session !== sessionId ||
        version !== frameVersion ||
        request !== focusRequestId ||
        target !== track ||
        disposed
      )
        return;
      focusMessage.value =
        result === "point"
          ? "Camera đã nhận điểm lấy nét."
          : result === "auto"
            ? "Camera đang tự lấy nét; thiết bị không hỗ trợ chọn điểm."
            : "Thiết bị không hỗ trợ điều khiển lấy nét. Giữ tem rõ trong khung.";
      if (result === "point")
        focusPoint.value = {
          x: ((clientX - bounds.left) / bounds.width) * 100,
          y: ((clientY - bounds.top) / bounds.height) * 100,
        };
    } finally {
      if (session === sessionId && target === track) focusBusy = false;
    }
  }

  function resume(): void {
    if (!active.value) return;
    paused = false;
    lastDecodeAt = 0;
  }

  const interrupt = () => {
    if (starting || fileScanning || active.value || stream) stop();
    options.onInterrupted?.();
  };
  const onVisibilityChange = () => {
    if (document.hidden) interrupt();
  };
  window.addEventListener("pagehide", interrupt);
  document.addEventListener("visibilitychange", onVisibilityChange);

  onBeforeUnmount(() => {
    disposed = true;
    stop();
    window.removeEventListener("pagehide", interrupt);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  });

  return {
    zoom: readonly(zoom),
    previewStyle,
    setZoom,
    updateFrame,
    focusAt,
    focusPoint: readonly(focusPoint),
    focusMessage: readonly(focusMessage),
    active: readonly(active),
    torchAvailable: readonly(torchAvailable),
    torchEnabled: readonly(torchEnabled),
    availableCameras: readonly(availableCameras),
    canSwitchCamera,
    switchCamera,
    start,
    stop,
    scanFile,
    resume,
    toggleTorch,
  };
}
