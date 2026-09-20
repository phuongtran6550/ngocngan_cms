<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="order-photo-capture"
      aria-label="Chụp ảnh đơn hàng"
      @cancel.prevent="closeCapture"
    >
      <header class="order-photo-capture__header">
        <button
          type="button"
          class="btn btn-sm btn-light"
          :disabled="disabled"
          @click="closeCapture"
        >
          <AppIcon name="arrow-left" class="me-2" />Giỏ hàng
        </button>
        <strong>Ảnh đơn hàng</strong>
        <button
          v-if="torchAvailable"
          type="button"
          class="btn btn-sm btn-light"
          :disabled="disabled || state !== 'ready'"
          :aria-pressed="torchEnabled"
          @click="toggleTorch"
        >
          <AppIcon name="zap" class="me-1" />{{
            torchEnabled ? "Tắt đèn" : "Bật đèn"
          }}
        </button>
      </header>
      <div
        ref="viewport"
        role="button"
        tabindex="0"
        aria-label="Chạm vào hình để chọn điểm lấy nét"
        @click="focusPhoto($event)"
        @keydown.enter.prevent="focusPhoto()"
        @keydown.space.prevent="focusPhoto()"
        class="order-photo-capture__viewport"
        :class="`is-${state}`"
      >
        <video
          ref="video"
          class="order-photo-capture__video"
          :style="previewStyle"
          @resize="updateFrame"
          autoplay
          muted
          playsinline
          aria-label="Hình ảnh trực tiếp từ camera sau để chụp đơn hàng"
        />
        <span
          v-if="focusPoint"
          class="order-photo-capture__focus"
          :style="{ left: `${focusPoint.x}px`, top: `${focusPoint.y}px` }"
          aria-hidden="true"
        />
        <div
          v-if="state === 'ready' || state === 'capturing'"
          class="order-photo-capture__guide"
          aria-hidden="true"
        >
          <div class="order-photo-capture__identity-zone is-name">
            <span>Tên khách</span>
          </div>
          <div class="order-photo-capture__product-zone">
            <span>Sản phẩm</span>
          </div>
          <div class="order-photo-capture__identity-zone is-phone">
            <span>SĐT</span>
          </div>
          <p class="order-photo-capture__guide-note">Không ghi giá lên bảng</p>
        </div>
        <div v-else class="order-photo-capture__placeholder" aria-live="polite">
          <span
            v-if="state === 'starting'"
            class="spinner-border text-light"
            aria-hidden="true"
          />
          <AppIcon v-else name="image" />
          <strong>{{ statusTitle }}</strong>
          <span>{{ statusMessage }}</span>
        </div>
      </div>
      <footer class="order-photo-capture__controls">
        <p class="order-photo-capture__focus-message" role="status">
          {{ focusMessage || "Chạm vào ảnh để lấy nét" }}
        </p>
        <div
          v-if="localError || qualityWarning"
          class="alert alert-subtle-warning py-2 mb-2"
          role="alert"
        >
          {{ localError || qualityWarning }}
        </div>
        <div
          v-if="state === 'ready' || state === 'capturing'"
          class="order-photo-capture__zoom"
          aria-label="Điều chỉnh độ phóng đại"
        >
          <button
            type="button"
            class="btn btn-sm btn-light"
            aria-label="Thu nhỏ"
            :disabled="disabled || state !== 'ready' || zoom <= minZoom"
            @click="changeZoom(-0.25)"
          >
            −
          </button>
          <input
            v-model.number="zoom"
            type="range"
            :min="minZoom"
            max="3"
            step="0.01"
            aria-label="Mức phóng đại"
            :aria-valuetext="`${zoom} lần`"
            :disabled="disabled || state !== 'ready'"
          />
          <button
            type="button"
            class="btn btn-sm btn-light"
            aria-label="Phóng to"
            :disabled="disabled || state !== 'ready' || zoom >= 3"
            @click="changeZoom(0.25)"
          >
            +
          </button>
          <output>{{ zoom }}×</output>
          <button
            type="button"
            class="btn btn-sm btn-light"
            :disabled="disabled || state !== 'ready'"
            @click="zoom = minZoom"
          >
            Toàn khung
          </button>
        </div>
        <div class="order-photo-capture__actions">
          <button
            type="button"
            class="btn btn-sm btn-light"
            :disabled="disabled || state === 'capturing'"
            @click="openFilePicker"
          >
            <AppIcon name="image" class="me-1" />Chọn ảnh
          </button>
          <button
            v-if="state === 'ready' || state === 'capturing'"
            type="button"
            class="order-photo-capture__shutter"
            :disabled="disabled || state === 'capturing'"
            aria-label="Chụp ảnh đơn hàng"
            @click="capturePhoto"
          >
            <span
              v-if="state === 'capturing'"
              class="spinner-border"
              aria-hidden="true"
            />
            <span v-else aria-hidden="true" />
          </button>
          <button
            v-else-if="state === 'error' || state === 'idle'"
            type="button"
            class="btn btn-primary"
            :disabled="disabled"
            @click="startCamera"
          >
            Mở lại camera
          </button>
        </div>
      </footer>
      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        :accept="imageAccept"
        tabindex="-1"
        aria-label="Chọn ảnh đơn hàng có sẵn"
        @change="selectFile"
      />
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import {
  attachEnvironmentCamera,
  normalizeEnvironmentCameraError,
  prepareEnvironmentCameraTrack,
  requestEnvironmentCamera,
  setEnvironmentCameraTorch,
  setEnvironmentCameraFocus,
  stopEnvironmentCamera,
  type EnvironmentCameraErrorCode,
} from "@/components/media/environment-camera";
import { createOverlayBehavior } from "@/components/overlay/behavior";
import AppIcon from "@/components/ui/AppIcon.vue";
import {
  IMAGE_FILE_ACCEPT,
  ORDER_PHOTO_IMAGE_OPTIMIZATION,
  calculateContainSize,
  optimizeImage,
  validateImageFile,
} from "@/utils/image-optimizer";

type CaptureState = "idle" | "starting" | "ready" | "capturing" | "error";

const props = withDefaults(
  defineProps<{
    active: boolean;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);
const emit = defineEmits<{
  back: [];
  captured: [file: File, warning: string];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const zoom = ref(1);
const viewport = ref<HTMLDivElement | null>(null);
const frame = ref({ width: 0, height: 0 });
const view = ref({ width: 0, height: 0 });
let resizeObserver: ResizeObserver | null = null;
const coverScale = computed(() =>
  frame.value.width && frame.value.height
    ? Math.max(
        view.value.width / frame.value.width,
        view.value.height / frame.value.height,
      )
    : 1,
);
const minZoom = computed(() => {
  if (
    !frame.value.width ||
    !frame.value.height ||
    !view.value.width ||
    !view.value.height ||
    !coverScale.value
  )
    return 0.5;
  const containScale = Math.min(
    view.value.width / frame.value.width,
    view.value.height / frame.value.height,
  );
  return Math.min(
    0.5,
    Math.max(0.01, Math.floor((containScale / coverScale.value) * 100) / 100),
  );
});
const previewStyle = computed(() => ({
  width: `${frame.value.width * coverScale.value}px`,
  height: `${frame.value.height * coverScale.value}px`,
  transform: `translate(-50%, -50%) scale(${zoom.value})`,
}));
function updateView(): void {
  const width = viewport.value?.clientWidth || 0;
  const height = viewport.value?.clientHeight || 0;
  if (width !== view.value.width || height !== view.value.height)
    view.value = { width, height };
}
function updateFrame(): void {
  const source = video.value;
  if (source?.videoWidth && source.videoHeight) {
    if (
      source.videoWidth !== frame.value.width ||
      source.videoHeight !== frame.value.height
    ) {
      frame.value = { width: source.videoWidth, height: source.videoHeight };
    }
    updateView();
  }
}
const overlay = createOverlayBehavior(closeCapture);
const video = ref<HTMLVideoElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const state = ref<CaptureState>("idle");
const message = ref("Camera sẽ mở ngay trong khung này.");
const localError = ref("");
const qualityWarning = ref("");
const torchAvailable = ref(false);
const torchEnabled = ref(false);
const focusMessage = ref("");
const focusPoint = ref<{ x: number; y: number } | null>(null);
let focusBusy = false;
let focusVersion = 0;
let focusTimer: ReturnType<typeof setTimeout> | undefined;
const imageAccept = IMAGE_FILE_ACCEPT;
let stream: MediaStream | null = null;
let track: MediaStreamTrack | null = null;
let sessionId = 0;
let disposed = false;

const statusTitle = computed(() => {
  if (state.value === "starting") return "Đang mở camera sau";
  if (state.value === "error") return "Không thể mở camera";
  if (state.value === "idle") return "Camera đang tạm dừng";
  return "Sẵn sàng chụp";
});
const statusMessage = computed(
  () => message.value || "Giữ máy ổn định và chụp rõ toàn bộ đơn hàng.",
);

function cameraMessage(code: EnvironmentCameraErrorCode): string {
  if (code === "permission-denied") {
    return "Hãy cấp quyền Camera cho trình duyệt hoặc chọn một ảnh có sẵn từ thiết bị.";
  }
  if (code === "unsupported") {
    return "Trình duyệt này không hỗ trợ camera trực tiếp. Bạn vẫn có thể chọn ảnh có sẵn.";
  }
  if (code === "no-camera") {
    return "Không tìm thấy camera phù hợp. Bạn vẫn có thể chọn ảnh có sẵn.";
  }
  return "Kiểm tra camera, đóng ứng dụng khác đang sử dụng camera rồi thử lại.";
}

function closeCapture(): void {
  if (!props.disabled) emit("back");
}

function changeZoom(delta: number): void {
  if (props.disabled || state.value !== "ready") return;
  focusPoint.value = null;
  zoom.value = Math.max(
    minZoom.value,
    Math.min(3, Math.round((zoom.value + delta) * 100) / 100),
  );
}

function syncDialog(active: boolean): void {
  if (active && !dialog.value?.open) dialog.value?.showModal();
  else if (!active) dialog.value?.close();
  overlay.sync(active);
}

async function focusPhoto(event?: MouseEvent): Promise<void> {
  const source = video.value;
  const target = track;
  if (
    !source ||
    !target ||
    !viewport.value ||
    props.disabled ||
    state.value !== "ready" ||
    focusBusy
  )
    return;
  const image = source.getBoundingClientRect();
  if (!image.width || !image.height) return;
  const x = event ? (event.clientX - image.left) / image.width : 0.5;
  const y = event ? (event.clientY - image.top) / image.height : 0.5;
  if (x < 0 || x > 1 || y < 0 || y > 1) return;
  const session = sessionId;
  const version = focusVersion;
  const viewRect = viewport.value.getBoundingClientRect();
  focusBusy = true;
  focusMessage.value = "Đang yêu cầu lấy nét…";
  focusPoint.value = null;
  clearTimeout(focusTimer);
  try {
    const result = await setEnvironmentCameraFocus(target, { x, y });
    if (
      session !== sessionId ||
      disposed ||
      track !== target ||
      version !== focusVersion
    )
      return;
    focusMessage.value =
      result === "point"
        ? "Đã chọn điểm lấy nét"
        : result === "auto"
          ? "Thiết bị chỉ hỗ trợ lấy nét tự động."
          : "Trình duyệt này không hỗ trợ chọn điểm lấy nét.";
    if (result === "point") {
      focusPoint.value = {
        x: image.left + x * image.width - viewRect.left,
        y: image.top + y * image.height - viewRect.top,
      };
      focusTimer = setTimeout(() => {
        focusPoint.value = null;
      }, 2000);
    }
  } catch {
    if (session === sessionId && !disposed && version === focusVersion)
      focusMessage.value =
        "Không thể thay đổi điểm lấy nét. Bạn vẫn có thể chụp ảnh.";
  } finally {
    if (session === sessionId) focusBusy = false;
  }
}

function releaseStream(target = stream): void {
  stopEnvironmentCamera(target, target === stream ? video.value : undefined);
  if (target === stream) {
    stream = null;
    track = null;
    torchAvailable.value = false;
    torchEnabled.value = false;
    focusBusy = false;
    focusPoint.value = null;
    focusMessage.value = "";
    clearTimeout(focusTimer);
  }
}

function stopCamera(nextState: CaptureState = "idle"): void {
  sessionId += 1;
  releaseStream();
  state.value = nextState;
}

async function startCamera(): Promise<void> {
  const session = ++sessionId;
  releaseStream();
  state.value = "starting";
  zoom.value = 1;
  message.value = "Vui lòng cho phép trình duyệt sử dụng camera nếu được hỏi.";
  localError.value = "";
  qualityWarning.value = "";
  await nextTick();

  try {
    const nextStream = await requestEnvironmentCamera();
    if (session !== sessionId || disposed || !props.active) {
      stopEnvironmentCamera(nextStream);
      return;
    }
    const targetVideo = video.value;
    if (!targetVideo) {
      stopEnvironmentCamera(nextStream);
      throw new Error("Order photo video element is unavailable");
    }

    stream = nextStream;
    track = nextStream.getVideoTracks()[0] || null;
    await attachEnvironmentCamera(targetVideo, nextStream);
    if (session !== sessionId || disposed || !props.active) {
      releaseStream(nextStream);
      return;
    }
    if (track) {
      const result = await prepareEnvironmentCameraTrack(track);
      if (session !== sessionId || disposed || !props.active) return;
      torchAvailable.value = result.torchAvailable;
    }
    frame.value = {
      width: targetVideo.videoWidth,
      height: targetVideo.videoHeight,
    };
    updateView();
    state.value = "ready";
    message.value = "Giữ máy ổn định và chụp rõ toàn bộ đơn hàng.";
  } catch (error) {
    if (session !== sessionId || disposed || !props.active) return;
    releaseStream();
    const normalized = normalizeEnvironmentCameraError(error);
    state.value = "error";
    message.value = cameraMessage(normalized.code);
  }
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Không thể tạo ảnh từ camera"));
      },
      "image/jpeg",
      ORDER_PHOTO_IMAGE_OPTIMIZATION.jpegQuality,
    );
  });
}

function updateResolutionWarning(width: number, height: number): void {
  qualityWarning.value =
    Math.max(width, height) > 0 && Math.max(width, height) < 1280
      ? "Ảnh hơi nhỏ, OCR có thể cần nhập thủ công. Bạn vẫn có thể tiếp tục ghi nhận đơn."
      : "";
}

async function inspectFileResolution(
  file: File,
  session: number,
): Promise<void> {
  if (typeof createImageBitmap !== "function") return;
  const image = await createImageBitmap(file);
  try {
    if (session === sessionId && props.active && !disposed) {
      updateResolutionWarning(image.width, image.height);
    }
  } finally {
    image.close();
  }
}

async function capturePhoto(): Promise<void> {
  const source = video.value;
  if (
    props.disabled ||
    !props.active ||
    disposed ||
    !source ||
    state.value !== "ready" ||
    !source.videoWidth ||
    !source.videoHeight ||
    !viewport.value?.clientWidth ||
    !viewport.value?.clientHeight
  )
    return;
  const session = sessionId;
  state.value = "capturing";
  localError.value = "";
  try {
    const canvas = document.createElement("canvas");
    // Save the visible camera area; zooming out reveals the full sensor frame, never invented pixels.
    const width = viewport.value.clientWidth;
    const height = viewport.value.clientHeight;
    const scale =
      Math.max(width / source.videoWidth, height / source.videoHeight) *
      zoom.value;
    const cropWidth = Math.min(source.videoWidth, width / scale);
    const cropHeight = Math.min(source.videoHeight, height / scale);
    const size = calculateContainSize(
      cropWidth,
      cropHeight,
      ORDER_PHOTO_IMAGE_OPTIMIZATION.maxEdge,
    );
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể khởi tạo khung chụp ảnh");
    context.drawImage(
      source,
      (source.videoWidth - cropWidth) / 2,
      (source.videoHeight - cropHeight) / 2,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const blob = await canvasBlob(canvas);
    if (session !== sessionId || !props.active || disposed) return;
    const file = new File([blob], `order-photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    validateImageFile(file);
    updateResolutionWarning(cropWidth, cropHeight);
    stopCamera();
    emit("captured", file, qualityWarning.value);
  } catch (error) {
    if (session !== sessionId || !props.active || disposed) return;
    state.value = "ready";
    localError.value =
      error instanceof Error ? error.message : "Không thể chụp ảnh đơn hàng";
  }
}

async function toggleTorch(): Promise<void> {
  if (!track || !torchAvailable.value) return;
  const targetTrack = track;
  const session = sessionId;
  const next = !torchEnabled.value;
  try {
    await setEnvironmentCameraTorch(targetTrack, next);
    if (session !== sessionId || track !== targetTrack || disposed) return;
    torchEnabled.value = next;
  } catch {
    if (session !== sessionId || track !== targetTrack || disposed) return;
    torchAvailable.value = false;
    torchEnabled.value = false;
    localError.value =
      "Thiết bị không thể thay đổi đèn camera trong phiên này.";
  }
}

function openFilePicker(): void {
  fileInput.value?.click();
}

async function selectFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (
    !file ||
    props.disabled ||
    !props.active ||
    disposed ||
    state.value === "capturing"
  )
    return;
  stopCamera("capturing");
  const session = sessionId;
  localError.value = "";
  qualityWarning.value = "";
  try {
    validateImageFile(file);
    await inspectFileResolution(file, session);
    if (session !== sessionId || !props.active || disposed) return;
    const prepared = await optimizeImage(
      file,
      undefined,
      ORDER_PHOTO_IMAGE_OPTIMIZATION,
    );
    if (session !== sessionId || !props.active || disposed) return;
    stopCamera();
    emit("captured", prepared, qualityWarning.value);
  } catch (error) {
    if (session !== sessionId || !props.active || disposed) return;
    state.value = "idle";
    localError.value =
      error instanceof Error ? error.message : "Ảnh đã chọn không hợp lệ";
  }
}

function interruptCamera(): void {
  if (
    !stream &&
    state.value !== "starting" &&
    state.value !== "ready" &&
    state.value !== "capturing"
  )
    return;
  stopCamera();
  message.value =
    "Camera đã tạm dừng khi trang không còn hiển thị. Nhấn Mở lại camera để tiếp tục.";
}

function onVisibilityChange(): void {
  if (document.hidden) interruptCamera();
}

watch(
  [zoom, frame, view],
  () => {
    focusVersion += 1;
    focusPoint.value = null;
    focusMessage.value = "";
    clearTimeout(focusTimer);
  },
  { flush: "sync" },
);

watch(
  () => props.active,
  (active) => {
    syncDialog(active);
    if (active) void startCamera();
    else stopCamera();
  },
);

onMounted(() => {
  syncDialog(props.active);
  resizeObserver = new ResizeObserver(updateView);
  if (viewport.value) resizeObserver.observe(viewport.value);
  updateView();
  window.addEventListener("pagehide", interruptCamera);
  document.addEventListener("visibilitychange", onVisibilityChange);
  if (props.active) void startCamera();
});

onBeforeUnmount(() => {
  disposed = true;
  dialog.value?.close();
  overlay.dispose();
  resizeObserver?.disconnect();
  stopCamera();
  window.removeEventListener("pagehide", interruptCamera);
  document.removeEventListener("visibilitychange", onVisibilityChange);
});
</script>

<style scoped>
.order-photo-capture__focus {
  position: absolute;
  z-index: 3;
  width: 3rem;
  height: 3rem;
  border: 2px solid #ffd43b;
  border-radius: 0.4rem;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.order-photo-capture__focus-message {
  margin: 0 0 0.5rem;
  text-align: center;
  font-size: 0.75rem;
}

.order-photo-capture {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  color: #fff;
  background: #071311;
  overflow: hidden;
}
.order-photo-capture[open] {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}
.order-photo-capture::backdrop {
  background: #071311;
}
.order-photo-capture__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: max(0.6rem, env(safe-area-inset-top))
    max(0.75rem, env(safe-area-inset-right)) 0.6rem
    max(0.75rem, env(safe-area-inset-left));
}
.order-photo-capture__header strong {
  flex: 1;
  font-size: 0.9rem;
}
.order-photo-capture__viewport {
  position: relative;
  min-height: 0;
  overflow: hidden;
}
.order-photo-capture__video {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  max-height: none;
  object-fit: contain;
  transform-origin: center;
}
.order-photo-capture__placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  background: #071311;
}
.order-photo-capture__placeholder span:last-child {
  max-width: 30rem;
  font-size: 0.85rem;
}
.order-photo-capture__guide {
  position: absolute;
  inset: 4%;
  display: grid;
  grid-template-rows: 18% 1fr 18%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 1rem;
  overflow: hidden;
  pointer-events: none;
  box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.12);
}
.order-photo-capture__identity-zone,
.order-photo-capture__product-zone {
  display: grid;
  place-items: center;
}
.order-photo-capture__identity-zone.is-name {
  border-bottom: 1px dashed rgba(255, 255, 255, 0.7);
}
.order-photo-capture__identity-zone.is-phone {
  border-top: 1px dashed rgba(255, 255, 255, 0.7);
}
.order-photo-capture__guide span {
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  color: #fff;
  background: rgba(0, 0, 0, 0.56);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}
.order-photo-capture__guide-note {
  position: absolute;
  right: 0.5rem;
  bottom: calc(18% + 0.5rem);
  margin: 0;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: rgba(185, 28, 28, 0.72);
  font-size: 0.65rem;
}
.order-photo-capture__controls {
  padding: 0.65rem max(0.75rem, env(safe-area-inset-right))
    max(0.75rem, env(safe-area-inset-bottom))
    max(0.75rem, env(safe-area-inset-left));
}
.order-photo-capture__zoom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}
.order-photo-capture__zoom input {
  width: min(22vw, 12rem);
  accent-color: #fff;
}
.order-photo-capture__zoom output {
  min-width: 3rem;
  font-variant-numeric: tabular-nums;
}
.order-photo-capture__actions {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.75rem;
}
.order-photo-capture__actions > :first-child {
  justify-self: start;
}
.order-photo-capture__shutter {
  display: grid;
  width: 4.5rem;
  height: 4.5rem;
  padding: 0.3rem;
  place-items: center;
  border: 3px solid #fff;
  border-radius: 50%;
  color: #fff;
  background: transparent;
}
.order-photo-capture__shutter > span:not(.spinner-border) {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
}
.order-photo-capture__shutter:disabled {
  opacity: 0.6;
}
@media (max-height: 500px) and (orientation: landscape) {
  .order-photo-capture__controls {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 10rem;
    background: rgba(0, 0, 0, 0.55);
    border-radius: 1rem 0 0 1rem;
  }
  .order-photo-capture__zoom {
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .order-photo-capture__zoom input {
    order: 4;
    width: 100%;
  }
  .order-photo-capture__actions {
    display: flex;
    flex-direction: column-reverse;
  }
  .order-photo-capture__guide {
    right: 10.5rem;
  }
}
</style>
