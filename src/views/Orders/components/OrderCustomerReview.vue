<template>
  <form class="customer-review" @submit.prevent="submit">
    <div class="customer-review-grid">
      <div>
        <ResourceImageCard
          :src="assetUrl(order.thumbnail)"
          :alt="`Ảnh ${order.orderCode}`"
          @preview="preview = assetUrl(order.thumbnail)"
        />
        <details v-if="order.ocr.rawText" class="mt-3">
          <summary class="fs-10 fw-semibold">Chi tiết văn bản OCR</summary>
          <pre class="ocr-raw-text mt-2 mb-0">{{ order.ocr.rawText }}</pre>
        </details>
      </div>

      <div>
        <div v-if="order.customerInfoStatus === 'review_required'" class="alert alert-subtle-warning fs-9">
          Gợi ý chỉ giúp nhập nhanh. Hãy đối chiếu trực tiếp với ảnh trước khi xác nhận.
        </div>
        <div v-else-if="order.customerInfoStatus === 'ocr_processing'" class="alert alert-subtle-info fs-9">
          Hệ thống vẫn đang đọc ảnh nền. Bạn có thể nhập ngay mà không cần chờ.
        </div>
        <div v-else-if="order.customerInfoStatus === 'complete'" class="alert alert-subtle-success fs-9">
          Thông tin khách hàng đã được ghi nhận. Bạn có thể đối chiếu với ảnh và điều chỉnh nếu thấy sai sót.
        </div>
        <div v-else class="alert alert-subtle-secondary fs-9">
          Ảnh chưa cho kết quả đủ rõ. Vui lòng nhập tên và số điện thoại từ ảnh.
        </div>

        <div v-if="reasonMessages.length" class="ocr-reasons mb-3" aria-label="Lưu ý khi kiểm duyệt">
          <span v-for="message in reasonMessages" :key="message" class="badge badge-phoenix badge-phoenix-secondary">
            {{ message }}
          </span>
        </div>

        <section v-if="hasSuggestion" class="ocr-suggestions mb-4">
          <div class="ocr-suggestions__header">
            <span class="ocr-suggestions__label">Gợi ý đọc từ ảnh</span>
            <small v-if="order.ocr.multimodal.attempted" class="text-body-tertiary">Đã dùng bước đọc ảnh bổ sung</small>
          </div>

          <div class="ocr-field-suggestion">
            <div>
              <span>Tên</span>
              <strong>{{ order.ocr.candidateName || "Không nhận được" }}</strong>
            </div>
            <span
              v-if="order.ocr.candidateName"
              class="badge badge-phoenix"
              :class="confidenceClass(order.ocr.nameConfidence)"
            >
              {{ confidenceLabel(order.ocr.nameConfidence) }}
            </span>
          </div>
          <div v-if="order.ocr.nameAlternatives.length" class="ocr-alternatives">
            <span>Cách đọc khác:</span>
            <button
              v-for="(candidate, index) in order.ocr.nameAlternatives"
              :key="`${candidate.value}-${index}`"
              type="button"
              class="btn btn-sm btn-phoenix-secondary"
              :data-ocr-alternative="`name-${index}`"
              @click="name = candidate.value"
            >
              {{ candidate.value }}
            </button>
          </div>

          <div class="ocr-field-suggestion">
            <div>
              <span>Điện thoại</span>
              <strong>{{ order.ocr.candidatePhone || "Không nhận được" }}</strong>
            </div>
            <span
              v-if="order.ocr.candidatePhone"
              class="badge badge-phoenix"
              :class="confidenceClass(order.ocr.phoneConfidence)"
            >
              {{ confidenceLabel(order.ocr.phoneConfidence) }}
            </span>
          </div>
          <div v-if="order.ocr.phoneAlternatives.length" class="ocr-alternatives">
            <span>Cách đọc khác:</span>
            <button
              v-for="(candidate, index) in order.ocr.phoneAlternatives"
              :key="`${candidate.value}-${index}`"
              type="button"
              class="btn btn-sm btn-phoenix-secondary"
              :data-ocr-alternative="`phone-${index}`"
              @click="phone = candidate.value"
            >
              {{ candidate.value }}
            </button>
          </div>
        </section>

        <div class="mb-3">
          <label class="form-label" for="review-customer-name">Tên khách hàng</label>
          <input
            id="review-customer-name"
            ref="nameInput"
            v-model="name"
            class="form-control"
            maxlength="100"
            autocomplete="name"
            required
          />
        </div>
        <div class="mb-3">
          <label class="form-label" for="review-customer-phone">Số điện thoại</label>
          <input
            id="review-customer-phone"
            v-model="phone"
            class="form-control"
            maxlength="50"
            inputmode="tel"
            autocomplete="tel"
            required
          />
        </div>
        <div v-if="error" class="alert alert-subtle-danger" role="alert">{{ error }}</div>
        <button type="submit" class="btn btn-primary w-100" :disabled="submitting || !name.trim() || !phone.trim()">
          <span v-if="submitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          {{ submitting ? "Đang lưu..." : (order.customerInfoStatus === 'complete' ? 'Lưu thay đổi thông tin khách' : 'Xác nhận thông tin đầy đủ') }}
        </button>
      </div>
    </div>
    <ImagePreview :src="preview" :alt="`Ảnh ${order.orderCode}`" @close="preview = ''" />
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import ImagePreview from "@/components/media/ImagePreview.vue";
import ResourceImageCard from "@/components/media/ResourceImageCard.vue";
import { assetUrl } from "@/request";
import type { OcrReasonCode, Order } from "@/views/Orders/types";

const props = defineProps<{ order: Order; submitting?: boolean; error?: string }>();
const emit = defineEmits<{ submit: [value: { name: string; phone: string; review: boolean }] }>();
const name = ref("");
const phone = ref("");
const preview = ref("");
const nameInput = ref<HTMLInputElement | null>(null);

const reasonLabels: Record<OcrReasonCode, string> = {
  NAME_NOT_FOUND: "Chưa đọc được tên",
  NAME_AMBIGUOUS: "Tên có nhiều cách đọc",
  PHONE_NOT_FOUND: "Chưa tìm thấy số điện thoại",
  PHONE_INVALID: "Số đọc được chưa hợp lệ",
  LOW_IMAGE_RESOLUTION: "Ảnh có độ phân giải thấp",
  LOW_TEXT_COVERAGE: "Chữ trong ảnh quá ít hoặc quá nhỏ",
  ORIENTATION_UNCERTAIN: "Hướng bảng chưa rõ",
  OCR_DISAGREEMENT: "Các dấu hiệu nhận dạng chưa thống nhất",
  MULTIMODAL_UNAVAILABLE: "Bước đọc ảnh bổ sung đang tạm gián đoạn",
  MULTIMODAL_INVALID_RESPONSE: "Bước đọc ảnh bổ sung trả về kết quả không hợp lệ",
};

const hasSuggestion = computed(() => Boolean(
  props.order.ocr.candidateName
  || props.order.ocr.candidatePhone
  || props.order.ocr.nameAlternatives.length
  || props.order.ocr.phoneAlternatives.length
));
const reasonMessages = computed(() => props.order.ocr.reasonCodes.map((code) => reasonLabels[code]));

function confidenceLabel(score: number): string {
  if (score >= 0.85) return "Cao";
  if (score >= 0.65) return "Trung bình";
  return "Thấp";
}

function confidenceClass(score: number): string {
  if (score >= 0.85) return "badge-phoenix-success";
  if (score >= 0.65) return "badge-phoenix-warning";
  return "badge-phoenix-secondary";
}

async function reset(): Promise<void> {
  name.value = props.order.name || props.order.ocr.candidateName || "";
  phone.value = props.order.phone || props.order.ocr.candidatePhone || "";
  if (props.order.customerInfoStatus === "manual_required" && !name.value) {
    await nextTick();
    nameInput.value?.focus();
  }
}

function submit(): void {
  emit("submit", {
    name: name.value.trim(),
    phone: phone.value.trim(),
    review: props.order.customerInfoStatus === "review_required",
  });
}

watch(() => props.order.id, () => { void reset(); }, { immediate: true });
</script>

<style scoped>
.customer-review-grid { display: grid; grid-template-columns: minmax(16rem, .9fr) minmax(0, 1.1fr); gap: 1.25rem; }
.ocr-reasons { display: flex; flex-wrap: wrap; gap: .45rem; }
.ocr-suggestions { display: grid; gap: .85rem; padding: 1rem; border: 1px solid rgba(var(--phoenix-warning-rgb), .32); border-radius: .75rem; background: rgba(var(--phoenix-warning-rgb), .08); }
.ocr-suggestions__header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
.ocr-suggestions__label { color: var(--phoenix-warning-text-emphasis); font-size: .68rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.ocr-field-suggestion { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.ocr-field-suggestion > div { display: grid; gap: .15rem; }
.ocr-field-suggestion span, .ocr-alternatives > span { color: var(--phoenix-secondary-color); font-size: .75rem; }
.ocr-field-suggestion strong { overflow-wrap: anywhere; }
.ocr-alternatives { display: flex; align-items: center; flex-wrap: wrap; gap: .4rem; margin-top: -.35rem; }
.ocr-raw-text { max-height: 12rem; padding: .75rem; overflow: auto; border-radius: .5rem; background: var(--phoenix-tertiary-bg); font-family: inherit; font-size: .75rem; white-space: pre-wrap; }
@media (max-width: 767.98px) {
  .customer-review-grid { grid-template-columns: 1fr; }
  .ocr-suggestions__header { align-items: flex-start; flex-direction: column; }
}
</style>
