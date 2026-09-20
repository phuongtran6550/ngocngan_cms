<template>
  <section class="card order-photo-capture">
    <div class="card-body p-3 p-md-4">
      <div class="order-photo-capture__header">
        <button
          type="button"
          class="btn btn-sm btn-phoenix-secondary"
          :disabled="disabled"
          @click="$emit('back')"
        >
          <AppIcon name="arrow-left" class="me-2" />
          Giỏ hàng
        </button>
        <div>
          <span class="order-photo-capture__eyebrow"
            >Bước 2 · Ảnh đơn hàng</span
          >
          <h2 class="fs-7 mb-1">Chụp toàn bộ đơn trong một khung hình</h2>
          <p class="text-body-tertiary fs-10 mb-0">
            Đặt bảng chiếm ít nhất nửa khung hình, giữ sản phẩm ở giữa và không
            ghi giá lên bảng.
          </p>
        </div>
        <span class="badge badge-phoenix badge-phoenix-danger">Bắt buộc</span>
      </div>

      <div class="order-photo-capture__viewport" :class="`is-${state}`">
        <video
          ref="video"
          class="order-photo-capture__video"
          autoplay
          muted
          playsinline
          aria-label="Hình ảnh trực tiếp từ camera sau để chụp đơn hàng"
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

        <button
          v-if="torchAvailable && (state === 'ready' || state === 'capturing')"
          type="button"
          class="btn btn-sm btn-light order-photo-capture__torch"
          :disabled="disabled || state === 'capturing'"
          :aria-pressed="torchEnabled"
          @click="toggleTorch"
        >
          <AppIcon name="zap" class="me-2" />
          {{ torchEnabled ? "Tắt đèn" : "Bật đèn" }}
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
      </div>

      <div
        v-if="state === 'error'"
        class="alert alert-subtle-warning mt-3 mb-0"
        role="alert"
      >
        <strong class="d-block mb-1">{{ statusTitle }}</strong>
        {{ statusMessage }}
      </div>
      <div
        v-if="localError"
        class="alert alert-subtle-danger mt-3 mb-0"
        role="alert"
      >
        {{ localError }}
      </div>
      <div
        v-if="qualityWarning"
        class="alert alert-subtle-warning mt-3 mb-0"
        role="status"
      >
        {{ qualityWarning }}
      </div>

      <div class="order-photo-capture__actions mt-3">
        <button
          v-if="state === 'error' || state === 'idle'"
          type="button"
          class="btn btn-primary"
          :disabled="disabled"
          @click="startCamera"
        >
          <AppIcon name="refresh" class="me-2" />
          Mở lại camera
        </button>
        <button
          type="button"
          class="btn btn-phoenix-secondary"
          :disabled="disabled || state === 'capturing'"
          @click="openFilePicker"
        >
          <AppIcon name="image" class="me-2" />
          Chọn ảnh có sẵn
        </button>
        <span class="text-body-tertiary fs-10">
          Ảnh chỉ được gửi lên hệ thống khi bạn ghi nhận đơn hàng ở bước cuối.
        </span>
      </div>

      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        :accept="imageAccept"
        tabindex="-1"
        aria-label="Chọn ảnh đơn hàng có sẵn"
        @change="selectFile"
      />
    </div>
  </section>
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
  stopEnvironmentCamera,
  type EnvironmentCameraErrorCode,
} from "@/components/media/environment-camera";
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

const video = ref<HTMLVideoElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const state = ref<CaptureState>("idle");
const message = ref("Camera sẽ mở ngay trong khung này.");
const localError = ref("");
const qualityWarning = ref("");
const torchAvailable = ref(false);
const torchEnabled = ref(false);
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

function releaseStream(target = stream): void {
  stopEnvironmentCamera(target, target === stream ? video.value : undefined);
  if (target === stream) {
    stream = null;
    track = null;
    torchAvailable.value = false;
    torchEnabled.value = false;
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
    !source.videoHeight
  )
    return;
  const session = sessionId;
  state.value = "capturing";
  localError.value = "";
  try {
    const canvas = document.createElement("canvas");
    const size = calculateContainSize(
      source.videoWidth,
      source.videoHeight,
      ORDER_PHOTO_IMAGE_OPTIMIZATION.maxEdge,
    );
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể khởi tạo khung chụp ảnh");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const blob = await canvasBlob(canvas);
    if (session !== sessionId || !props.active || disposed) return;
    const file = new File([blob], `order-photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    validateImageFile(file);
    updateResolutionWarning(source.videoWidth, source.videoHeight);
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
  () => props.active,
  (active) => {
    if (active) void startCamera();
    else stopCamera();
  },
);

onMounted(() => {
  window.addEventListener("pagehide", interruptCamera);
  document.addEventListener("visibilitychange", onVisibilityChange);
  if (props.active) void startCamera();
});

onBeforeUnmount(() => {
  disposed = true;
  stopCamera();
  window.removeEventListener("pagehide", interruptCamera);
  document.removeEventListener("visibilitychange", onVisibilityChange);
});
</script>

<style scoped>
.order-photo-capture {
  overflow: hidden;
  border: 1px solid var(--phoenix-border-color-translucent);
}
.order-photo-capture__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
  margin-bottom: 1rem;
}
.order-photo-capture__eyebrow {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--phoenix-primary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.order-photo-capture__viewport {
  position: relative;
  min-height: min(68vh, 44rem);
  overflow: hidden;
  border-radius: 1rem;
  background: #071311;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.order-photo-capture__video {
  display: block;
  width: 100%;
  height: min(68vh, 44rem);
  object-fit: contain;
  background: #071311;
}
.order-photo-capture__placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.65rem;
  padding: 2rem;
  color: #fff;
  text-align: center;
  background:
    radial-gradient(
      circle at 50% 35%,
      rgba(15, 118, 110, 0.35),
      transparent 38%
    ),
    #071311;
}
.order-photo-capture__placeholder .cms-icon {
  width: 2.5rem;
  height: 2.5rem;
  opacity: 0.7;
}
.order-photo-capture__placeholder span:last-child {
  max-width: 30rem;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.82rem;
}
.order-photo-capture__guide {
  position: absolute;
  inset: 5% 5% 15%;
  display: grid;
  grid-template-rows: minmax(4rem, 18%) 1fr minmax(4rem, 18%);
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.82);
  border-radius: 1rem;
  box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.12);
  pointer-events: none;
}
.order-photo-capture__identity-zone,
.order-photo-capture__product-zone {
  position: relative;
  display: grid;
  place-items: center;
}
.order-photo-capture__identity-zone.is-name {
  border-bottom: 1px dashed rgba(255, 255, 255, 0.72);
}
.order-photo-capture__identity-zone.is-phone {
  border-top: 1px dashed rgba(255, 255, 255, 0.72);
}
.order-photo-capture__guide span {
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  color: #fff;
  background: rgba(0, 0, 0, 0.56);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.order-photo-capture__guide-note {
  position: absolute;
  right: 0.65rem;
  bottom: calc(18% + 0.55rem);
  margin: 0;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  color: #fff;
  background: rgba(185, 28, 28, 0.72);
  font-size: 0.65rem;
  font-weight: 700;
}
.order-photo-capture__torch {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
}
.order-photo-capture__shutter {
  position: absolute;
  z-index: 3;
  bottom: 1.25rem;
  left: 50%;
  display: grid;
  width: 4.75rem;
  height: 4.75rem;
  padding: 0.35rem;
  place-items: center;
  transform: translateX(-50%);
  border: 3px solid rgba(255, 255, 255, 0.92);
  border-radius: 50%;
  color: #102a26;
  background: rgba(5, 24, 21, 0.35);
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.35);
}
.order-photo-capture__shutter > span:not(.spinner-border) {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}
.order-photo-capture__shutter:hover > span:not(.spinner-border) {
  transform: scale(0.92);
}
.order-photo-capture__shutter:disabled {
  opacity: 0.7;
}
.order-photo-capture__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.order-photo-capture__actions > span {
  margin-left: auto;
}
@media (max-width: 767.98px) {
  .order-photo-capture__header {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .order-photo-capture__header > .badge {
    grid-column: 2;
    justify-self: start;
  }
  .order-photo-capture__viewport,
  .order-photo-capture__video {
    min-height: 65vh;
    height: 65vh;
  }
  .order-photo-capture__actions > span {
    width: 100%;
    margin-left: 0;
  }
}
@media (max-width: 575.98px) {
  .order-photo-capture__header {
    grid-template-columns: 1fr;
  }
  .order-photo-capture__header > .badge {
    grid-column: 1;
  }
  .order-photo-capture__header > .btn {
    justify-self: start;
  }
  .order-photo-capture__viewport,
  .order-photo-capture__video {
    min-height: 58vh;
    height: 58vh;
  }
  .order-photo-capture__actions .btn {
    flex: 1 1 auto;
  }
}
</style>
