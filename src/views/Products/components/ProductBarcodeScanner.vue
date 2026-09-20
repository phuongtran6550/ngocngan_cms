<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="dialog"
      class="modal fade show d-block product-scanner-modal"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-scanner-title"
      data-testid="product-barcode-scanner"
      @pointerdown="enableSound"
      @keydown="enableSound(); trapFocus($event)"
    >
      <div class="modal-dialog modal-dialog-centered product-scanner-dialog">
        <div class="modal-content overflow-hidden">
          <div class="modal-header align-items-start">
            <div>
              <h2 id="product-scanner-title" class="modal-title fs-7">{{ title }}</h2>
              <p class="mb-0 mt-1 text-body-tertiary fs-10">
                {{ description }}
              </p>
            </div>
            <button
              ref="closeButton"
              type="button"
              class="btn-close"
              aria-label="Đóng trình quét barcode"
              @click="requestClose"
            />
          </div>

          <div class="modal-body p-3 p-sm-4">
            <div
              ref="viewport"
              class="scanner-viewport"
              :class="`is-${state}`"
              role="button"
              tabindex="0"
              aria-label="Chạm để lấy nét camera; nhấn Enter để lấy nét chính giữa"
              :aria-disabled="!camera.active.value"
              @pointerdown="camera.focusAt"
              @keydown.enter.prevent="camera.focusAt()"
              @keydown.space.prevent="camera.focusAt()"
            >
              <video
                ref="video"
                class="scanner-video"
                :style="camera.previewStyle.value"
                autoplay
                muted
                playsinline
                aria-label="Hình ảnh trực tiếp từ camera sau"
                @resize="camera.updateFrame"
              />
              <div class="scanner-guide" aria-hidden="true">
                <span v-for="corner in 4" :key="corner" />
              </div>
              <span
                v-if="camera.focusPoint.value"
                class="scanner-focus-point"
                :style="{ left: `${camera.focusPoint.value.x}%`, top: `${camera.focusPoint.value.y}%` }"
                aria-hidden="true"
              />
              <div
                v-if="!camera.active.value"
                class="scanner-placeholder text-center"
              >
                <span
                  v-if="isBusy"
                  class="spinner-border text-light"
                  aria-hidden="true"
                />
                <AppIcon v-else name="scan-line" />
              </div>

            </div>

            <p v-if="camera.focusMessage.value" class="text-body-tertiary fs-10 mt-2 mb-0" role="status">
              {{ camera.focusMessage.value }}
            </p>

            <div v-if="camera.active.value" class="d-flex align-items-center gap-2 mt-3">
              <button
                type="button"
                class="btn btn-sm btn-phoenix-secondary"
                aria-label="Thu nhỏ camera"
                :disabled="camera.zoom.value <= 0.5"
                @click="camera.setZoom(camera.zoom.value - 0.25)"
              >−</button>
              <input
                type="range"
                class="form-range flex-grow-1"
                min="0.5"
                max="3"
                step="0.05"
                :value="camera.zoom.value"
                aria-label="Độ thu phóng camera"
                :aria-valuetext="`${camera.zoom.value} lần`"
                @input="camera.setZoom(Number(($event.target as HTMLInputElement).value))"
              />
              <output class="text-nowrap fs-9" aria-live="polite">
                {{ camera.zoom.value.toFixed(2) }}×
              </output>
              <button
                type="button"
                class="btn btn-sm btn-phoenix-secondary"
                aria-label="Phóng to camera"
                :disabled="camera.zoom.value >= 3"
                @click="camera.setZoom(camera.zoom.value + 0.25)"
              >+</button>
            </div>

            <div
              class="scanner-status mt-3"
              :class="{ 'is-error': !lastProduct && isErrorState, 'has-product': lastProduct }"
              aria-live="polite"
              aria-atomic="true"
            >
              <template v-if="lastProduct">
                <div class="scanner-product-heading">
                  <div class="scanner-product-label">
                    <AppIcon name="check-circle" aria-hidden="true" />
                    {{ continuous ? "Sản phẩm vừa thêm" : "Sản phẩm vừa quét" }}
                  </div>
                  <strong class="scanner-product-name">{{ lastProduct.sku.name }}</strong>
                </div>
                <div class="scanner-product-metrics">
                  <div class="scanner-product-metric">
                    <span>Giá sản phẩm</span>
                    <strong>{{ formatMoney(lastProduct.sku.price) }}</strong>
                  </div>
                  <div v-if="lastProduct.itemQuantity !== undefined" class="scanner-product-metric">
                    <span>Tổng sản phẩm</span>
                    <strong>{{ lastProduct.itemQuantity }}</strong>
                  </div>
                </div>
                <div v-if="lastProduct.total !== undefined" class="scanner-product-total">
                  <span>Tổng đơn hiện tại</span>
                  <strong>{{ formatMoney(lastProduct.total) }}</strong>
                </div>
              </template>
              <template v-else>
                <strong>{{ statusTitle }}</strong>
                <span>{{ statusMessage }}</span>
                <code v-if="barcode" class="scanner-barcode">{{ barcode }}</code>
              </template>
            </div>

            <div
              v-if="lastProduct && (isErrorState || isBusy)"
              class="alert mt-3 mb-0 fs-10"
              :class="isErrorState ? 'alert-subtle-warning' : 'alert-subtle-info'"
              role="status"
            >
              <strong>{{ statusTitle }}</strong>
              <div>{{ statusMessage }}</div>
            </div>

            <div
              v-if="state === 'camera-error' && cameraHelp"
              class="alert alert-subtle-warning mt-3 mb-0 fs-10"
            >
              {{ cameraHelp }}
            </div>

            <div class="scanner-actions mt-3">
              <button
                v-if="!soundReady"
                type="button"
                class="btn btn-sm btn-phoenix-secondary"
                @click="enableSound"
              >
                Bật âm báo
              </button>
              <button
                v-if="camera.torchAvailable.value && state === 'scanning'"
                type="button"
                class="btn btn-sm btn-phoenix-secondary"
                :aria-pressed="camera.torchEnabled.value"
                @click="camera.toggleTorch"
              >
                <AppIcon name="zap" class="me-2" />
                {{ camera.torchEnabled.value ? "Tắt đèn" : "Bật đèn" }}
              </button>
              <button
                v-if="canRescan"
                type="button"
                class="btn btn-sm btn-primary"
                @click="startScan"
              >
                <AppIcon name="scan-line" class="me-2" />
                Quét lại
              </button>
              <button
                v-if="canRetryLookup"
                type="button"
                class="btn btn-sm btn-primary"
                @click="retryLookup"
              >
                Thử tìm lại
              </button>
              <button
                type="button"
                class="btn btn-sm btn-phoenix-secondary"
                :disabled="isBusy"
                @click="openFilePicker"
              >
                <AppIcon name="image" class="me-2" />
                Chọn ảnh tem
              </button>
              <button
                v-if="isErrorState"
                type="button"
                class="btn btn-sm btn-link text-decoration-none"
                @click="requestClose"
              >
                Đóng và tìm thủ công
              </button>
            </div>

            <input
              ref="fileInput"
              class="visually-hidden"
              type="file"
              accept="image/*"
              tabindex="-1"
              aria-label="Chọn ảnh tem có barcode"
              @change="scanSelectedFile"
            />
          </div>
        </div>
      </div>
    </div>
    <ToastRegion
      v-if="open"
      class="scanner-toast"
      :toasts="scanToasts"
      @dismiss="clearScanResult"
    />
    <button
      v-if="open"
      type="button"
      class="modal-backdrop fade show border-0 p-0"
      aria-label="Đóng trình quét barcode"
      @click="requestClose"
    />
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
} from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import ToastRegion from "@/components/toast/index.vue";
import { createOverlayBehavior } from "@/components/overlay/behavior";
import { apiError } from "@/request";
import { formatMoney } from "@/utils/resource-display";
import { productService } from "@/views/Products/service";
import type { BarcodeResolutionFeedback, ProductSku } from "@/views/Products/types";
import {
  useBarcodeCamera,
  type BarcodeCameraError,
} from "@/views/Products/scanner/useBarcodeCamera";
import { preloadBarcodeReader } from "@/views/Products/scanner/zxing-reader";

type ScannerState =
  | "idle"
  | "preparing"
  | "requesting-permission"
  | "scanning"
  | "looking-up"
  | "not-found"
  | "camera-error"
  | "lookup-error"
  | "closed";

const props = withDefaults(defineProps<{
  open: boolean;
  continuous?: boolean;
  title?: string;
  description?: string;
  resolver?: (sku: ProductSku) => BarcodeResolutionFeedback | void;
}>(), {
  continuous: false,
  title: "Quét barcode sản phẩm",
  description: "Đưa tem vào khung. Hệ thống tự nhận khi hình ảnh đủ rõ.",
});
const emit = defineEmits<{
  close: [];
  resolved: [sku: ProductSku];
}>();

const dialog = ref<HTMLElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
const video = ref<HTMLVideoElement | null>(null);
const viewport = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const state = ref<ScannerState>("idle");
const barcode = ref("");
const message = ref("");
const cameraHelp = ref("");
const lookupErrorCode = ref("");
const resolutionError = ref(false);
const lastProduct = ref<{ sku: ProductSku; total?: number; itemQuantity?: number } | null>(null);
const scanResult = ref<{
  ok: boolean;
  sku?: ProductSku;
  quantity?: number;
  total?: number;
  message: string;
} | null>(null);
let resultTimer: ReturnType<typeof setTimeout> | undefined;
const scanToasts = computed(() => {
  const result = scanResult.value;
  if (!result) return [];
  const text = result.ok && result.sku
    ? `${props.continuous ? "Đã thêm" : "Đã tìm thấy"} ${result.sku.name}\nGiá: ${formatMoney(result.sku.price)}${result.total !== undefined ? `\nTổng đơn hiện tại: ${formatMoney(result.total)}` : ""}`
    : result.message;
  return [{ id: "scanner-result", message: text, variant: result.ok ? "success" as const : "danger" as const }];
});
function clearScanResult(): void {
  clearTimeout(resultTimer);
  resultTimer = undefined;
  scanResult.value = null;
}
function showScanResult(result: NonNullable<typeof scanResult.value>): void {
  clearScanResult();
  scanResult.value = result;
  resultTimer = setTimeout(clearScanResult, 2000);
}
const soundReady = ref(false);
let audio: AudioContext | null = null;
let previousFocus: HTMLElement | null = null;
let lookupController: AbortController | null = null;
let lookupRequestId = 0;
let fileRequestId = 0;
let startRequestId = 0;

const camera = useBarcodeCamera({
  video,
  viewport,
  continuous: props.continuous,
  onDetected: (value) => {
    barcode.value = value;
    void lookupBarcode(value);
  },
  onUnsupported: (value) => {
    message.value = `Mã ${value} không phải barcode hàng hóa 8 hoặc 12 chữ số.`;
  },
  onInterrupted: () => {
    if (!props.open) return;
    startRequestId += 1;
    fileRequestId += 1;
    cancelLookup();
    state.value = "camera-error";
    message.value = "Phiên quét đã tạm dừng khi trang không còn hiển thị.";
    cameraHelp.value = "Nhấn Quét lại để mở camera trong một phiên mới.";
  },
  onError: handleCameraError,
});

const overlay = createOverlayBehavior(requestClose);
const isBusy = computed(() =>
  ["preparing", "requesting-permission", "looking-up"].includes(state.value),
);
const isErrorState = computed(() =>
  resolutionError.value || ["not-found", "camera-error", "lookup-error"].includes(state.value),
);
const canRescan = computed(
  () =>
    state.value === "not-found" ||
    state.value === "camera-error" ||
    (state.value === "lookup-error" &&
      lookupErrorCode.value === "INVALID_INVENTORY_BARCODE"),
);
const canRetryLookup = computed(
  () =>
    state.value === "lookup-error" &&
    Boolean(barcode.value) &&
    !["INVALID_INVENTORY_BARCODE", "DUPLICATE_INVENTORY_BARCODE"].includes(
      lookupErrorCode.value,
    ),
);
const statusTitle = computed(() => {
  const titles: Record<ScannerState, string> = {
    idle: "Sẵn sàng quét",
    preparing: "Đang chuẩn bị bộ đọc barcode",
    "requesting-permission": "Đang mở camera",
    scanning: "Đang quét",
    "looking-up": "Đã nhận barcode, đang tìm SKU",
    "not-found": "Không tìm thấy SKU",
    "camera-error": "Không thể tiếp tục quét",
    "lookup-error": "Không thể tra cứu SKU",
    closed: "Đã đóng trình quét",
  };
  return titles[state.value];
});
const statusMessage = computed(() => {
  if (message.value) return message.value;
  if (state.value === "scanning") {
    return "Đưa tem lại gần, giữ máy ổn định và tránh ánh sáng phản chiếu.";
  }
  return "Camera và ảnh được phân tích trực tiếp trên thiết bị.";
});

function handleCameraError(error: BarcodeCameraError): void {
  state.value = "camera-error";
  message.value = error.message;
  cameraHelp.value =
    error.code === "permission-denied"
      ? "Hãy cho phép Camera trong cài đặt của trình duyệt hoặc chọn ảnh tem từ thư viện."
      : error.code === "unsupported" || error.code === "no-camera"
        ? "Bạn vẫn có thể dùng nút Chọn ảnh tem để đọc barcode ngay trên thiết bị."
        : "Kiểm tra camera, đóng ứng dụng khác đang sử dụng camera rồi thử lại.";
}

function cancelLookup(): void {
  lookupRequestId += 1;
  lookupController?.abort();
  lookupController = null;
}

function closeSession(): void {
  clearScanResult();
  lastProduct.value = null;
  const previousAudio = audio;
  audio = null;
  soundReady.value = false;
  if (previousAudio) void previousAudio.close().catch(() => undefined);
  startRequestId += 1;
  fileRequestId += 1;
  cancelLookup();
  camera.stop();
  state.value = "closed";
  barcode.value = "";
  message.value = "";
  cameraHelp.value = "";
  lookupErrorCode.value = "";
  resolutionError.value = false;
  const target = previousFocus;
  previousFocus = null;
  if (target) void nextTick(() => target.focus());
}

function requestClose(): void {
  closeSession();
  emit("close");
}

async function startScan(): Promise<void> {
  clearScanResult();
  const requestId = ++startRequestId;
  fileRequestId += 1;
  cancelLookup();
  barcode.value = "";
  message.value = "";
  cameraHelp.value = "";
  lookupErrorCode.value = "";
  resolutionError.value = false;
  state.value = "preparing";
  await nextTick();
  if (requestId !== startRequestId || !props.open) return;
  state.value = "requesting-permission";
  const [readerResult] = await Promise.all([
    preloadBarcodeReader().then(
      () => ({ ok: true as const }),
      (error) => ({ ok: false as const, error }),
    ),
    camera.start(),
  ]);
  if (requestId !== startRequestId || !props.open) return;
  if (!readerResult.ok) {
    camera.stop();
    state.value = "camera-error";
    message.value = "Không thể tải bộ đọc barcode trên thiết bị.";
    cameraHelp.value = "Kiểm tra kết nối và thử lại hoặc chọn một ảnh tem.";
    return;
  }
  if (camera.active.value) state.value = "scanning";
}

function lookupMessage(code?: string, fallback?: string): string {
  if (code === "DUPLICATE_INVENTORY_BARCODE") {
    return "Barcode đang bị trùng dữ liệu. Vui lòng liên hệ quản trị viên.";
  }
  if (code === "INVALID_INVENTORY_BARCODE") {
    return "Mã nhận được không phải barcode hàng hóa 8 hoặc 12 chữ số.";
  }
  return fallback || "Không thể tra cứu SKU. Vui lòng thử lại.";
}

async function lookupBarcode(value: string): Promise<void> {
  clearScanResult();
  cancelLookup();
  const requestId = ++lookupRequestId;
  lookupController = new AbortController();
  state.value = "looking-up";
  message.value = "";
  lookupErrorCode.value = "";
  resolutionError.value = false;
  try {
    const sku = await productService.byBarcode(
      value,
      lookupController.signal,
    );
    if (requestId !== lookupRequestId || !props.open) return;
    const resolution = props.resolver?.(sku);
    const ok = resolution?.ok !== false;
    if (ok) lastProduct.value = { sku, total: resolution?.total, itemQuantity: resolution?.itemQuantity };
    showScanResult({ ok, sku, quantity: resolution?.quantity, total: resolution?.total, message: resolution?.message || "" });
    feedback(ok);
    emit("resolved", sku);
    if (props.continuous) {
      state.value = "scanning";
      resolutionError.value = resolution?.ok === false;
      message.value = ok ? "" : resolution?.message || "Không thể thêm sản phẩm.";
      camera.resume();
    }
  } catch (error) {
    if (requestId !== lookupRequestId || !props.open) return;
    const normalized = apiError(error);
    if (normalized.code === "ERR_CANCELED") return;
    lookupErrorCode.value = normalized.code || "";
    resolutionError.value = true;
    showScanResult({ ok: false, message: normalized.code === "PRODUCT_BARCODE_NOT_FOUND" ? `Không tìm thấy SKU cho barcode ${value}.` : lookupMessage(normalized.code, normalized.message) });
    feedback(false);
    if (normalized.code === "PRODUCT_BARCODE_NOT_FOUND") {
      message.value = `Không tìm thấy SKU cho barcode ${value}.`;
      if (props.continuous) {
        state.value = "scanning";
        camera.resume();
      } else {
        state.value = "not-found";
      }
      return;
    }
    state.value = "lookup-error";
    message.value = lookupMessage(normalized.code, normalized.message);
    if (props.continuous) camera.resume();
  } finally {
    if (requestId === lookupRequestId) lookupController = null;
  }
}

function retryLookup(): void {
  if (barcode.value) void lookupBarcode(barcode.value);
}

function openFilePicker(): void {
  fileInput.value?.click();
}

async function scanSelectedFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  const requestId = ++fileRequestId;
  clearScanResult();
  cancelLookup();
  state.value = "preparing";
  barcode.value = "";
  message.value = "Đang phân tích ảnh tem trực tiếp trên thiết bị.";
  lookupErrorCode.value = "";
  resolutionError.value = false;
  const value = await camera.scanFile(file);
  if (requestId !== fileRequestId || !props.open) return;
  if (value) {
    barcode.value = value;
    await lookupBarcode(value);
    return;
  }
  if (state.value === "preparing") {
    state.value = "camera-error";
    message.value = "Không đọc được barcode rõ ràng từ ảnh đã chọn.";
    cameraHelp.value = "Chọn ảnh rõ hơn, tránh lóa và giữ trọn phần vạch barcode.";
  }
}

function enableSound(): void {
  try {
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    audio ??= new AudioContextClass();
    const target = audio;
    if (target.state === "running") {
      soundReady.value = true;
      return;
    }
    void target.resume().then(() => {
      if (audio === target) soundReady.value = target.state === "running";
    }).catch(() => {
      if (audio === target) soundReady.value = false;
    });
  } catch {
    soundReady.value = false;
  }
}

function feedback(ok: boolean): void {
  try {
    navigator.vibrate?.(ok ? 40 : [70, 40, 70]);
    if (!audio || audio.state !== "running") {
      soundReady.value = false;
      return;
    }
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const end = audio.currentTime + (ok ? 0.12 : 0.24);
    gain.gain.setValueAtTime(0.12, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    oscillator.frequency.value = ok ? 1046 : 220;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(end);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
  } catch {
    // Visual confirmation and cart updates must work even when sound is unavailable.
  }
}

function trapFocus(event: KeyboardEvent): void {
  if (event.key !== "Tab" || !dialog.value) return;
  const focusable = Array.from(
    dialog.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("hidden"));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (open) => {
    overlay.sync(open);
    if (!open) {
      closeSession();
      return;
    }
    enableSound();
    previousFocus = document.activeElement as HTMLElement | null;
    await nextTick();
    closeButton.value?.focus();
    void startScan();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  closeSession();
  overlay.dispose();
});
</script>

<style scoped>
.product-scanner-dialog {
  width: min(100% - 1rem, 34rem);
  max-width: 34rem;
  margin-inline: auto;
}

.scanner-viewport {
  position: relative;
  display: grid;
  width: min(100%, 28rem);
  aspect-ratio: 1;
  margin-inline: auto;
  overflow: hidden;
  place-items: center;
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.12), transparent 42%),
    #07131d;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.scanner-video {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  transform: translate(-50%, -50%);
  object-fit: contain;
}

.scanner-guide {
  position: relative;
  z-index: 2;
  width: 90%;
  height: 45%;
  border-radius: 0.75rem;
  box-shadow: 0 0 0 999px rgba(3, 10, 16, 0.42);
  pointer-events: none;
}

.scanner-focus-point {
  position: absolute;
  z-index: 3;
  width: 2.5rem;
  height: 2.5rem;
  border: 2px solid var(--phoenix-warning);
  border-radius: 0.375rem;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.scanner-guide span {
  position: absolute;
  width: 2.25rem;
  height: 2.25rem;
  border-color: #5ce1b9;
  border-style: solid;
  filter: drop-shadow(0 0 0.35rem rgba(92, 225, 185, 0.45));
}

.scanner-guide span:nth-child(1) {
  top: 0;
  left: 0;
  border-width: 0.2rem 0 0 0.2rem;
  border-radius: 0.75rem 0 0;
}

.scanner-guide span:nth-child(2) {
  top: 0;
  right: 0;
  border-width: 0.2rem 0.2rem 0 0;
  border-radius: 0 0.75rem 0 0;
}

.scanner-guide span:nth-child(3) {
  right: 0;
  bottom: 0;
  border-width: 0 0.2rem 0.2rem 0;
  border-radius: 0 0 0.75rem;
}

.scanner-guide span:nth-child(4) {
  bottom: 0;
  left: 0;
  border-width: 0 0 0.2rem 0.2rem;
  border-radius: 0 0 0 0.75rem;
}

.scanner-placeholder {
  position: relative;
  z-index: 3;
  display: grid;
  color: rgba(255, 255, 255, 0.85);
  place-items: center;
}

.scanner-placeholder :deep(.cms-icon) {
  width: 3rem;
  height: 3rem;
}

.scanner-toast :deep(.toast) {
  width: min(22rem, calc(100vw - 2rem));
}
.scanner-toast :deep(.toast-body > span) {
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.scanner-status {
  display: grid;
  gap: 0.25rem;
  min-height: 4.5rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.875rem;
  background: var(--phoenix-tertiary-bg);
}

.scanner-status.is-error {
  border-color: rgba(var(--phoenix-danger-rgb), 0.35);
}

.scanner-status span {
  color: var(--phoenix-secondary-color);
  font-size: 0.8125rem;
}

.scanner-barcode {
  width: fit-content;
  margin-top: 0.25rem;
  color: var(--phoenix-body-color);
  font-size: 0.9rem;
}

.scanner-status.has-product {
  gap: 0;
  padding: 0;
  overflow: hidden;
  background: var(--phoenix-body-bg);
}
.scanner-product-heading {
  display: grid;
  gap: 0.625rem;
  padding: 1rem 1rem 0;
}
.scanner-product-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--phoenix-success-text-emphasis);
  font-size: 0.75rem;
  font-weight: 700;
}
.scanner-product-label :deep(.cms-icon) {
  width: 1rem;
  height: 1rem;
}
.scanner-product-name {
  color: var(--phoenix-body-color);
  font-size: 1.125rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.scanner-product-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
}
.scanner-product-metric {
  display: grid;
  flex: 1 1 8rem;
  gap: 0.25rem;
  min-width: 0;
}
.scanner-product-metric strong {
  color: var(--phoenix-body-color);
  font-size: 1.125rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}
.scanner-product-total {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.375rem 0.75rem;
  padding: 0.875rem 1rem;
  border-top: 1px solid rgba(var(--phoenix-success-rgb), 0.2);
  background: rgba(var(--phoenix-success-rgb), 0.06);
}
.scanner-product-total strong {
  color: var(--phoenix-success-text-emphasis);
  font-size: 1.5rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.scanner-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.625rem;
}

@media (max-width: 575.98px) {
  .product-scanner-dialog {
    width: calc(100% - 0.75rem);
  }

  .product-scanner-modal .modal-body {
    padding: 0.75rem !important;
  }

  .scanner-viewport {
    border-radius: 1rem;
  }

  .scanner-actions .btn {
    flex: 1 1 auto;
  }
}
</style>
