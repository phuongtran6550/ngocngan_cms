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
      @keydown="trapFocus"
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
            <div class="scanner-viewport" :class="`is-${state}`">
              <video
                ref="video"
                class="scanner-video"
                autoplay
                muted
                playsinline
                aria-label="Hình ảnh trực tiếp từ camera sau"
              />
              <div class="scanner-shade" aria-hidden="true" />
              <div class="scanner-guide" aria-hidden="true">
                <span v-for="corner in 4" :key="corner" />
              </div>
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

            <div
              class="scanner-status mt-3"
              :class="{ 'is-error': isErrorState }"
              aria-live="polite"
              aria-atomic="true"
            >
              <strong>{{ statusTitle }}</strong>
              <span>{{ statusMessage }}</span>
              <code v-if="barcode" class="scanner-barcode">{{ barcode }}</code>
            </div>

            <div
              v-if="state === 'camera-error' && cameraHelp"
              class="alert alert-subtle-warning mt-3 mb-0 fs-10"
            >
              {{ cameraHelp }}
            </div>

            <div class="scanner-actions mt-3">
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
import { createOverlayBehavior } from "@/components/overlay/behavior";
import { apiError } from "@/request";
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
const fileInput = ref<HTMLInputElement | null>(null);
const state = ref<ScannerState>("idle");
const barcode = ref("");
const message = ref("");
const cameraHelp = ref("");
const lookupErrorCode = ref("");
const resolutionError = ref(false);
let previousFocus: HTMLElement | null = null;
let lookupController: AbortController | null = null;
let lookupRequestId = 0;
let fileRequestId = 0;
let startRequestId = 0;

const camera = useBarcodeCamera({
  video,
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
    feedback();
    const resolution = props.resolver?.(sku);
    emit("resolved", sku);
    if (props.continuous) {
      state.value = "scanning";
      resolutionError.value = resolution?.ok === false;
      message.value = resolution?.message || `${sku.name} · ${sku.skuCode || sku.barcode} đã được nhận.`;
      camera.resume();
    }
  } catch (error) {
    if (requestId !== lookupRequestId || !props.open) return;
    const normalized = apiError(error);
    if (normalized.code === "ERR_CANCELED") return;
    lookupErrorCode.value = normalized.code || "";
    resolutionError.value = true;
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

function feedback(): void {
  navigator.vibrate?.(40);
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    gain.gain.value = 0.04;
    oscillator.frequency.value = 880;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.06);
    oscillator.addEventListener("ended", () => void audio.close(), {
      once: true,
    });
  } catch {
    // Feedback is optional; scanning success must not depend on audio support.
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

.scanner-video,
.scanner-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.scanner-video {
  object-fit: cover;
}

.scanner-shade {
  background: radial-gradient(
    ellipse 47% 25% at center,
    transparent 0 96%,
    rgba(3, 10, 16, 0.42) 100%
  );
  pointer-events: none;
}

.scanner-guide {
  position: relative;
  z-index: 2;
  width: 90%;
  height: 45%;
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
