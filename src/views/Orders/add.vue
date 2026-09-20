<template>
  <section
    class="fast-checkout-page"
    :class="{ 'has-sticky-action': step !== 'photo' }"
  >
    <PageHeader
      title="Bán hàng nhanh"
      description="Quét sản phẩm, chụp ảnh toàn bộ đơn rồi ghi nhận. Thông tin khách hàng có thể để trống và bổ sung sau."
    >
      <template #actions>
        <RouterLink
          v-if="auth.can('orders.view')"
          class="btn btn-sm btn-phoenix-secondary"
          to="/orders"
          >Danh sách đơn</RouterLink
        >
      </template>
    </PageHeader>

    <div v-if="created" class="sale-success-panel" role="status">
      <div>
        <span class="sale-success-panel__eyebrow">Đơn vừa lưu thành công</span>
        <h2>{{ created.orderCode }}</h2>
        <p class="mb-0">
          Tồn kho đã được trừ.
          {{
            created.customerInfoStatus === "complete"
              ? "Thông tin khách hàng đã đầy đủ."
              : "OCR đang chạy nền để bổ sung thông tin khách hàng."
          }}
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <RouterLink
          v-if="auth.can('orders.view')"
          class="btn btn-phoenix-secondary"
          :to="`/orders/${created.id}`"
          >Xem đơn</RouterLink
        >
        <button type="button" class="btn btn-primary" @click="nextOrder">
          Quét đơn tiếp theo
        </button>
      </div>
    </div>

    <div
      v-if="feedback"
      class="alert"
      :class="feedbackOk ? 'alert-subtle-success' : 'alert-subtle-warning'"
      role="status"
    >
      {{ feedback }}
    </div>
    <div v-if="error" class="alert alert-subtle-danger" role="alert">
      {{ error }}
    </div>

    <div class="checkout-stepper" aria-label="Tiến trình tạo đơn hàng">
      <div
        v-for="item in checkoutSteps"
        :key="item.id"
        class="checkout-stepper__item"
        :class="stepClass(item.id)"
        :aria-current="item.id === step ? 'step' : undefined"
        :aria-label="`Bước ${item.number}: ${item.title}. ${item.description}`"
      >
        <span>{{ item.number }}</span>
        <div>
          <strong>{{ item.title }}</strong>
          <small>{{ item.description }}</small>
        </div>
      </div>
    </div>

    <template v-if="step === 'cart'">
      <SalesCart
        :refreshing-sku-ids="refreshingSkuIds"
        @feedback="showCartFeedback"
        @retry="refreshSku"
      >
        <template #actions>
          <button
            type="button"
            class="btn btn-primary text-nowrap"
            :disabled="submitting"
            @click="scannerOpen = true"
          >
            <AppIcon name="scan-line" class="me-2" />Quét barcode
          </button>
        </template>
      </SalesCart>
    </template>

    <OrderPhotoCapture
      v-if="step === 'photo'"
      :active="step === 'photo'"
      :disabled="submitting"
      @back="returnToCart"
      @captured="acceptPhoto"
    />

    <div v-if="step === 'customer'" class="checkout-customer-grid">
      <section class="card customer-photo-card">
        <div class="card-body">
          <div
            class="d-flex align-items-start justify-content-between gap-3 mb-3"
          >
            <div>
              <span class="customer-photo-card__eyebrow"
                >Bước 3 · Kiểm tra nhanh</span
              >
              <h2 class="fs-8 mb-1">Ảnh đơn hàng đã chụp</h2>
              <p class="text-body-tertiary fs-10 mb-0">
                Ảnh này sẽ được lưu cùng hóa đơn và dùng cho OCR nếu thông tin
                khách còn thiếu.
              </p>
            </div>
            <span class="badge badge-phoenix badge-phoenix-success"
              >Đã có ảnh</span
            >
          </div>
          <div class="customer-photo-card__preview">
            <img
              v-if="photoPreview"
              :src="photoPreview"
              alt="Ảnh đơn hàng chuẩn bị ghi nhận"
            />
          </div>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              class="btn btn-sm btn-phoenix-secondary"
              :disabled="submitting"
              @click="retakePhoto"
            >
              <AppIcon name="refresh" class="me-2" />Chụp lại
            </button>
            <button
              type="button"
              class="btn btn-sm btn-link text-decoration-none"
              :disabled="submitting"
              @click="returnToCart"
            >
              <AppIcon name="arrow-left" class="me-2" />Sửa giỏ hàng
            </button>
          </div>
        </div>
      </section>
      <CustomerIdentityFields
        v-model:name="name"
        v-model:phone="phone"
        :disabled="submitting"
      />
    </div>

    <div
      v-if="step !== 'photo'"
      class="checkout-sticky"
      :class="{ 'has-conflict': cart.hasStockConflict }"
    >
      <div>
        <span>{{ cart.itemQuantity }} món</span>
        <strong>{{ money(cart.total) }}</strong>
        <small v-if="cart.hasUnverifiedStock"
          >Có SKU chưa xác minh tồn kho</small
        >
        <small v-else-if="cart.hasStockConflict">Có SKU không đủ tồn kho</small>
        <small v-else-if="step === 'cart'">Chụp ảnh ở bước tiếp theo</small>
        <small v-else>Tên và số điện thoại không bắt buộc</small>
      </div>
      <button
        v-if="step === 'cart'"
        type="button"
        class="btn btn-primary btn-lg"
        :disabled="!canLockCart"
        @click="lockCart"
      >
        Chốt hóa đơn
      </button>
      <button
        v-else
        type="button"
        class="btn btn-primary btn-lg"
        :disabled="!canCheckout"
        @click="checkout"
      >
        <span
          v-if="submitting"
          class="spinner-border spinner-border-sm me-2"
          aria-hidden="true"
        />
        {{ submitting ? "Đang ghi nhận đơn…" : "Ghi nhận đơn hàng" }}
      </button>
    </div>

    <OrderBarcodeScanner
      :open="scannerOpen"
      @close="scannerOpen = false"
      @feedback="scannerFeedback"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import PageHeader from "@/components/app/PageHeader.vue";
import { apiError } from "@/request";
import { formatMoney } from "@/utils/resource-display";
import { isMissingSkuError, useSalesCartStore } from "@/views/Orders/cart";
import {
  createOrderIdempotencyKey,
  orderService,
} from "@/views/Orders/service";
import type { Order } from "@/views/Orders/types";
import CustomerIdentityFields from "@/views/Orders/components/CustomerIdentityFields.vue";
import OrderBarcodeScanner from "@/views/Orders/components/OrderBarcodeScanner.vue";
import OrderPhotoCapture from "@/views/Orders/components/OrderPhotoCapture.vue";
import SalesCart from "@/views/Orders/components/SalesCart.vue";
import { productService } from "@/views/Products/service";
import { authenStore } from "@/stores/app-authen";

type CheckoutStep = "cart" | "photo" | "customer";

const cart = useSalesCartStore();
const auth = authenStore();
const step = ref<CheckoutStep>("cart");
const scannerOpen = ref(false);
const photo = ref<File | null>(null);
const photoPreview = ref("");
const name = ref("");
const phone = ref("");
const error = ref("");
const feedback = ref("");
const feedbackOk = ref(true);
const submitting = ref(false);
const created = ref<Order | null>(null);
const submitKey = ref("");
const refreshingSkuIds = ref<string[]>([]);

const checkoutSteps: Array<{
  id: CheckoutStep;
  number: number;
  title: string;
  description: string;
}> = [
  {
    id: "cart",
    number: 1,
    title: "Giỏ hàng",
    description: "Quét và kiểm tra SKU",
  },
  {
    id: "photo",
    number: 2,
    title: "Chụp đơn",
    description: "Một ảnh toàn bộ sản phẩm",
  },
  {
    id: "customer",
    number: 3,
    title: "Thông tin",
    description: "Tùy chọn rồi ghi nhận",
  },
];
const stepPosition: Record<CheckoutStep, number> = {
  cart: 0,
  photo: 1,
  customer: 2,
};

const canLockCart = computed(() =>
  Boolean(
    !submitting.value &&
    cart.lines.length &&
    !cart.hasStockConflict &&
    !cart.hasUnverifiedStock,
  ),
);
const canCheckout = computed(() =>
  Boolean(
    !submitting.value &&
    step.value === "customer" &&
    photo.value &&
    cart.lines.length &&
    !cart.hasStockConflict &&
    !cart.hasUnverifiedStock,
  ),
);
const cartContentSignature = computed(() =>
  cart.lines
    .map((line) => `${line.skuId}:${line.quantity}`)
    .sort()
    .join("|"),
);

function money(value: number): string {
  return formatMoney(value);
}
function resetSubmitKey(): void {
  submitKey.value = "";
  error.value = "";
}
function showCartFeedback(message: string): void {
  feedback.value = message;
  feedbackOk.value = false;
}
function scannerFeedback(message: string, ok: boolean): void {
  created.value = null;
  feedback.value = message;
  feedbackOk.value = ok;
  resetSubmitKey();
}

function stepClass(target: CheckoutStep): Record<string, boolean> {
  const current = stepPosition[step.value];
  const position = stepPosition[target];
  return {
    "is-active": current === position,
    "is-complete": current > position,
  };
}

function revokePhotoPreview(): void {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
  photoPreview.value = "";
}

function clearPhoto(): void {
  revokePhotoPreview();
  photo.value = null;
}

function setPhoto(file: File): void {
  clearPhoto();
  photo.value = file;
  photoPreview.value = URL.createObjectURL(file);
  resetSubmitKey();
}

function lockCart(): void {
  if (!canLockCart.value) return;
  created.value = null;
  scannerOpen.value = false;
  error.value = "";
  feedback.value = "";
  step.value = "photo";
}

function acceptPhoto(file: File, warning = ""): void {
  setPhoto(file);
  feedback.value = warning;
  feedbackOk.value = false;
  step.value = "customer";
}

function retakePhoto(): void {
  if (submitting.value) return;
  clearPhoto();
  submitKey.value = "";
  error.value = "";
  feedback.value = "";
  step.value = "photo";
}

function returnToCart(): void {
  if (submitting.value) return;
  const discardedPhoto = Boolean(photo.value);
  clearPhoto();
  submitKey.value = "";
  error.value = "";
  step.value = "cart";
  if (discardedPhoto) {
    feedback.value =
      "Ảnh cũ đã được bỏ. Sau khi sửa giỏ hàng, hãy chốt và chụp lại đơn.";
    feedbackOk.value = false;
  }
}

async function checkout(): Promise<void> {
  if (!canCheckout.value || !photo.value) return;
  submitting.value = true;
  error.value = "";
  feedback.value = "";
  if (!submitKey.value) submitKey.value = createOrderIdempotencyKey();
  try {
    const order = await orderService.checkout(
      {
        image: photo.value,
        name: name.value,
        phone: phone.value,
        items: cart.lines.map((line) => ({
          skuId: line.skuId,
          quantity: line.quantity,
        })),
      },
      submitKey.value,
    );
    created.value = order;
    cart.clear();
    clearPhoto();
    name.value = "";
    phone.value = "";
    step.value = "cart";
    submitKey.value = "";
  } catch (checkoutError) {
    const normalized = apiError(checkoutError);
    const conflictSkuId = String(
      normalized.details?.skuId || normalized.errors?.skuId || "",
    );
    const cartConflict = [
      "ORDER_STOCK_INSUFFICIENT",
      "ORDER_SKU_NOT_FOUND",
      "ORDER_SKU_INACTIVE",
    ].includes(normalized.code || "");
    if (cartConflict && conflictSkuId) {
      await refreshSku(conflictSkuId);
    }
    if (cartConflict) {
      clearPhoto();
      submitKey.value = "";
      step.value = "cart";
      error.value =
        normalized.code === "ORDER_STOCK_INSUFFICIENT"
          ? "Tồn kho vừa thay đổi. Giỏ hàng được giữ nguyên; vui lòng kiểm tra SKU được cảnh báo rồi chụp lại đơn."
          : "Một SKU không còn khả dụng. Giỏ hàng được giữ nguyên; vui lòng xóa sản phẩm được cảnh báo rồi chụp lại đơn.";
    } else {
      error.value = normalized.message;
    }
  } finally {
    submitting.value = false;
  }
}

function nextOrder(): void {
  created.value = null;
  step.value = "cart";
  feedback.value = "";
  error.value = "";
  scannerOpen.value = true;
}

async function refreshSku(skuId: string): Promise<void> {
  if (refreshingSkuIds.value.includes(skuId)) return;
  cart.markUnverified(skuId);
  refreshingSkuIds.value = [...refreshingSkuIds.value, skuId];
  try {
    cart.refreshSku(await productService.detail(skuId));
  } catch (refreshError) {
    if (isMissingSkuError(refreshError)) cart.markUnavailable(skuId);
  } finally {
    refreshingSkuIds.value = refreshingSkuIds.value.filter(
      (id) => id !== skuId,
    );
  }
}

async function refreshCart(): Promise<void> {
  await Promise.all(cart.lines.map((line) => refreshSku(line.skuId)));
}

watch([name, phone], () => {
  if (!submitting.value) resetSubmitKey();
});
watch(cartContentSignature, (next, previous) => {
  resetSubmitKey();
  if (next === previous || !photo.value) return;
  clearPhoto();
  step.value = "cart";
  feedback.value =
    "Giỏ hàng đã thay đổi nên ảnh cũ không còn hợp lệ. Vui lòng chốt và chụp lại đơn.";
  feedbackOk.value = false;
});
onMounted(() => {
  cart.initialize();
  void refreshCart();
});
onBeforeUnmount(() => clearPhoto());
</script>

<style scoped>
.fast-checkout-page.has-sticky-action {
  padding-bottom: 7rem;
}
.checkout-stepper {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.checkout-stepper__item {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
  padding: 0.75rem;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.85rem;
  background: var(--phoenix-body-bg);
}
.checkout-stepper__item > span {
  display: grid;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border: 2px solid var(--phoenix-border-color);
  border-radius: 50%;
  color: var(--phoenix-secondary-color);
  background: var(--phoenix-body-bg);
  font-size: 0.8rem;
  font-weight: 800;
}
.checkout-stepper__item > div {
  display: grid;
  min-width: 0;
}
.checkout-stepper__item strong {
  font-size: 0.8rem;
}
.checkout-stepper__item small {
  overflow: hidden;
  color: var(--phoenix-secondary-color);
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.checkout-stepper__item.is-active {
  border-color: rgba(var(--phoenix-primary-rgb), 0.45);
  background: rgba(var(--phoenix-primary-rgb), 0.06);
}
.checkout-stepper__item.is-active > span {
  border-color: var(--phoenix-primary);
  color: #fff;
  background: var(--phoenix-primary);
  box-shadow: 0 0 0 0.25rem rgba(var(--phoenix-primary-rgb), 0.12);
}
.checkout-stepper__item.is-complete > span {
  border-color: var(--phoenix-success);
  color: #fff;
  background: var(--phoenix-success);
}
.sale-success-panel__eyebrow {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.78;
}
.checkout-customer-grid {
  display: grid;
  grid-template-columns: minmax(20rem, 0.78fr) minmax(0, 1.22fr);
  gap: 1rem;
  align-items: start;
}
.customer-photo-card {
  overflow: hidden;
  border: 1px solid var(--phoenix-border-color-translucent);
}
.customer-photo-card__eyebrow {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--phoenix-primary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.customer-photo-card__preview {
  display: grid;
  min-height: 22rem;
  overflow: hidden;
  place-items: center;
  border-radius: 0.85rem;
  background: #071311;
}
.customer-photo-card__preview img {
  display: block;
  width: 100%;
  max-height: 34rem;
  object-fit: contain;
}
.checkout-sticky {
  position: fixed;
  z-index: 1015;
  right: 1rem;
  bottom: 1rem;
  left: calc(var(--phoenix-navbar-vertical-width, 15.875rem) + 1rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 70rem;
  margin-inline: auto;
  padding: 0.8rem 0.9rem 0.8rem 1.1rem;
  border: 1px solid rgba(var(--phoenix-success-rgb), 0.3);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--phoenix-body-bg) 92%, transparent);
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.2);
  backdrop-filter: blur(14px);
}
.checkout-sticky > div {
  display: grid;
}
.checkout-sticky span,
.checkout-sticky small {
  color: var(--phoenix-secondary-color);
  font-size: 0.75rem;
}
.checkout-sticky strong {
  font-size: 1.25rem;
}
.checkout-sticky.has-conflict {
  border-color: rgba(var(--phoenix-danger-rgb), 0.45);
}
.sale-success-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1.25rem;
  border: 1px solid rgba(var(--phoenix-success-rgb), 0.3);
  border-radius: 1rem;
  background: rgba(var(--phoenix-success-rgb), 0.08);
}
.sale-success-panel h2 {
  margin-bottom: 0.25rem;
}
@media (max-width: 991.98px) {
  .checkout-customer-grid {
    grid-template-columns: 1fr;
  }
  .checkout-sticky {
    left: 1rem;
  }
}
@media (max-width: 767.98px) {
  .checkout-stepper__item {
    justify-content: center;
    padding: 0.6rem;
  }
  .checkout-stepper__item > div {
    display: none;
  }
}
@media (max-width: 575.98px) {
  .sale-success-panel {
    align-items: stretch;
    flex-direction: column;
  }
  .sale-success-panel .btn {
    width: 100%;
  }
  .customer-photo-card__preview {
    min-height: 17rem;
  }
  .checkout-sticky {
    right: 0.5rem;
    bottom: 0.5rem;
    left: 0.5rem;
    border-radius: 0.85rem;
  }
  .checkout-sticky .btn {
    min-width: 9.5rem;
  }
}
</style>
