import {
  onBeforeUnmount,
  readonly,
  ref,
  type Ref,
} from "vue";
import {
  attachEnvironmentCamera,
  normalizeEnvironmentCameraError,
  prepareEnvironmentCameraTrack,
  requestEnvironmentCamera,
  setEnvironmentCameraTorch,
  stopEnvironmentCamera,
} from "@/components/media/environment-camera";
import { isInventoryBarcode } from "@/utils/inventory-barcode";
import { BarcodeCandidateStabilizer } from "@/views/Products/scanner/barcode-candidate";
import {
  readBarcodeValues,
  type BarcodeDecodeMode,
} from "@/views/Products/scanner/zxing-reader";

const DECODE_INTERVAL_MS = 120;
const FULL_FRAME_INTERVAL = 5;
const MAX_DECODE_EDGE = 1_280;
const GUIDE_WIDTH_RATIO = 0.9;
const GUIDE_HEIGHT_RATIO = 0.45;

export type BarcodeCameraErrorCode =
  | "unsupported"
  | "permission-denied"
  | "no-camera"
  | "camera"
  | "decoder";

export interface BarcodeCameraError {
  code: BarcodeCameraErrorCode;
  message: string;
  cause?: unknown;
}

interface BarcodeCameraOptions {
  video: Ref<HTMLVideoElement | null>;
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
): BarcodeSourceRegion {
  const safeViewportWidth = viewportWidth > 0 ? viewportWidth : 1;
  const safeViewportHeight = viewportHeight > 0 ? viewportHeight : 1;
  const coverScale = Math.max(
    safeViewportWidth / sourceWidth,
    safeViewportHeight / sourceHeight,
  );
  const renderedWidth = sourceWidth * coverScale;
  const renderedHeight = sourceHeight * coverScale;
  const cropX = Math.max((renderedWidth - safeViewportWidth) / 2, 0);
  const cropY = Math.max((renderedHeight - safeViewportHeight) / 2, 0);
  const guideWidth = safeViewportWidth * GUIDE_WIDTH_RATIO;
  const guideHeight = safeViewportHeight * GUIDE_HEIGHT_RATIO;
  const guideX = (safeViewportWidth - guideWidth) / 2;
  const guideY = (safeViewportHeight - guideHeight) / 2;
  const x = Math.max(Math.round((guideX + cropX) / coverScale), 0);
  const y = Math.max(Math.round((guideY + cropY) / coverScale), 0);

  return {
    x,
    y,
    width: Math.min(
      Math.max(Math.round(guideWidth / coverScale), 1),
      sourceWidth - x,
    ),
    height: Math.min(
      Math.max(Math.round(guideHeight / coverScale), 1),
      sourceHeight - y,
    ),
  };
}

export function useBarcodeCamera(options: BarcodeCameraOptions) {
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
    stopEnvironmentCamera(stream, options.video.value);
    stream = null;
    track = null;
    active.value = false;
    torchAvailable.value = false;
    torchEnabled.value = false;
    canvas.width = 0;
    canvas.height = 0;
  }

  function captureFrame(video: HTMLVideoElement, fullFrame: boolean): ImageData | null {
    if (!context || !video.videoWidth || !video.videoHeight) return null;
    const viewportWidth = video.clientWidth || 1;
    const viewportHeight = video.clientHeight || viewportWidth;
    const region = fullFrame
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
        );
    const sourceX = region.x;
    const sourceY = region.y;
    const sourceWidth = region.width;
    const sourceHeight = region.height;
    const scale = Math.min(1, MAX_DECODE_EDGE / Math.max(sourceWidth, sourceHeight));
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

  async function decodeFrame(
    session: number,
    video: HTMLVideoElement,
    mode: BarcodeDecodeMode,
  ): Promise<void> {
    const image = captureFrame(video, mode === "recovery");
    if (!image) return;
    try {
      const values = await readBarcodeValues(image, mode);
      if (session !== sessionId || disposed) return;
      observe(values, performance.now());
    } catch (error) {
      if (session !== sessionId || disposed) return;
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
      if (paused || decoding || time - lastDecodeAt < DECODE_INTERVAL_MS) return;
      const video = options.video.value;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
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

  async function start(): Promise<void> {
    stop();
    const session = ++sessionId;
    starting = true;
    try {
      const nextStream = await requestEnvironmentCamera();
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
      active.value = true;
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
        (value) =>
          isInventoryBarcode(value) && globalHistogram.includes(value),
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
    active: readonly(active),
    torchAvailable: readonly(torchAvailable),
    torchEnabled: readonly(torchEnabled),
    start,
    stop,
    scanFile,
    resume,
    toggleTorch,
  };
}
