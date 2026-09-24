<template>
  <section class="card sales-cart-card">
    <div
      class="card-header bg-transparent d-flex flex-wrap align-items-center justify-content-between gap-3"
    >
      <div>
        <h2 class="fs-7 mb-1">Giỏ hàng</h2>
        <p class="fs-10 text-body-tertiary mb-0">
          Giá bán lấy từ kho. Thu ngân có thể nhập điều chỉnh tổng thành tiền khi khách trả giá.
        </p>
      </div>
      <div class="d-flex align-items-center gap-3">
        <span class="badge badge-phoenix badge-phoenix-primary"
          >{{ cart.itemQuantity }} món</span
        >
        <slot name="actions" />
      </div>
    </div>
    <div v-if="!cart.lines.length" class="card-body text-center py-6">
      <div class="sales-cart-empty-icon"><AppIcon name="scan-line" /></div>
      <h3 class="fs-8 mt-3 mb-1">Quét barcode để bắt đầu</h3>
      <p class="text-body-tertiary fs-9 mb-0">
        Mỗi lần quét cùng một SKU sẽ tăng số lượng.
      </p>
    </div>
    <div v-else class="sales-cart-lines">
      <article
        v-for="line in cart.lines"
        :key="line.skuId"
        class="sales-cart-line"
      >
        <img
          :src="assetUrl(line.thumbnail)"
          :alt="line.productName"
          class="sales-cart-thumb"
        />
        <div class="sales-cart-copy">
          <div class="mb-2">
            <h3 v-if="line.productName" class="fs-9 fw-bold text-body-emphasis mb-1">
              {{ line.productName }}
            </h3>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="badge badge-phoenix badge-phoenix-primary font-monospace fs-9 fw-bold px-2 py-0.5">
                <AppIcon name="scan-line" class="me-1 fs-10" />{{ line.skuCode || line.barcode }}
              </span>
            </div>
          </div>

          <div class="mb-2">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2 fs-9">
              <span class="text-body-secondary">
                <strong class="text-body-emphasis fs-9">{{ money(line.unitPrice) }}</strong> / món
                <span class="text-body-quaternary mx-1">·</span>
                Tồn: <strong :class="line.stock <= 0 ? 'text-danger' : 'text-body-highlight'">{{ line.stock }}</strong>
              </span>
              <span
                v-if="line.pricingType"
                class="badge badge-phoenix fs-10 px-2 py-0.5"
                :class="
                  line.pricingType === 'Đồ cân'
                    ? 'badge-phoenix-info'
                    : line.pricingType === 'Đồ món'
                      ? 'badge-phoenix-warning'
                      : 'badge-phoenix-secondary'
                "
              >
                {{ line.pricingType }}
              </span>
              <span
                class="badge badge-phoenix fs-10 px-2 py-0.5"
                :class="
                  isManualPrice(line)
                    ? 'badge-phoenix-warning'
                    : 'badge-phoenix-success'
                "
              >
                {{ isManualPrice(line) ? "Giá nhập thủ công" : "Giá tự động" }}
              </span>
            </div>

            <!-- Bảng thành tiền rút gọn: 1. Thành tiền (Đã làm tròn), 2. Tiền xi, 3. Tổng thành tiền -->
            <div class="sales-cart-pricing-summary mt-2 pt-1 border-top border-translucent">
              <div class="d-flex justify-content-between align-items-center py-1">
                <span class="text-body-secondary fs-8">
                  {{ isManualPrice(line) ? "Thành tiền (Giá nhập thủ công) :" : "Thành tiền (Đã làm tròn) :" }}
                </span>
                <span class="fw-semibold text-body-highlight fs-8">
                  {{ money(getLineRoundedBasePrice(line) * line.quantity) }}
                  <small
                    v-if="line.quantity > 1"
                    class="text-body-tertiary fw-normal fs-9 ms-1"
                  >
                    ({{ money(getLineRoundedBasePrice(line)) }} × {{ line.quantity }})
                  </small>
                </span>
              </div>
              <div class="d-flex justify-content-between align-items-center py-1">
                <span class="text-body-secondary fs-8">Tiền xi :</span>
                <span
                  v-if="(Number(line.platingCost) || 0) > 0"
                  class="fw-semibold text-info-emphasis fs-8"
                >
                  +{{ money((Number(line.platingCost) || 0) * line.quantity) }}
                  <small
                    v-if="line.quantity > 1"
                    class="text-body-tertiary fw-normal fs-9 ms-1"
                  >
                    ({{ money(Number(line.platingCost) || 0) }} × {{ line.quantity }})
                  </small>
                </span>
                <span v-else class="text-body-tertiary fs-8 fw-medium">
                  0 đ
                </span>
              </div>
              <div class="d-flex justify-content-between align-items-center pt-2 mt-1 border-top border-dashed border-translucent flex-wrap gap-2">
                <div>
                  <div class="d-flex align-items-center gap-1.5 flex-wrap">
                    <span class="fw-bold text-body-emphasis fs-7">Tổng thành tiền :</span>
                  </div>
                  <div v-if="isLineAdjusted(line)" class="d-flex align-items-center gap-2 mt-0.5">
                    <small class="text-body-tertiary fs-10 text-decoration-line-through">
                      Giá gốc: {{ money((line.originalUnitPrice ?? line.unitPrice) * line.quantity) }}
                    </small>
                    <button
                      type="button"
                      class="btn btn-link btn-sm p-0 fs-10 text-primary text-decoration-none"
                      @click="resetLinePrice(line)"
                    >
                      Khôi phục giá gốc
                    </button>
                  </div>
                </div>

                <div class="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                  <div class="input-group input-group-sm sales-cart-price-input-group">
                    <input
                      :id="`cart-price-${line.skuId}`"
                      type="text"
                      inputmode="numeric"
                      class="form-control form-control-sm text-end font-monospace fw-bold text-primary fs-7"
                      :value="formatInputNumber(getLineDisplayTotal(line))"
                      placeholder="0"
                      @focus="onPriceFocus"
                      @input="onPriceInput(line, $event)"
                      @blur="onPriceBlur(line, $event)"
                      @keydown.enter="($event.target as HTMLInputElement).blur()"
                    />
                    <span class="input-group-text px-2 text-primary fw-bold">₫</span>
                  </div>
                  <span
                    v-if="isLineAdjusted(line)"
                    class="text-warning-emphasis fw-semibold fs-8 font-monospace text-nowrap"
                  >
                    ({{ line.adjustedBy || auth.displayName }} điều chỉnh)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="cart.isStockUnverified(line.skuId)"
            class="alert alert-subtle-warning py-2 px-3 mb-2 fs-10"
            role="status"
          >
            <span v-if="isRefreshing(line.skuId)"
              >Đang kiểm tra tồn kho...</span
            >
            <template v-else>
              Chưa thể kiểm tra tồn kho. Số lượng và thông tin sản phẩm được giữ
              nguyên.
              <button
                type="button"
                class="btn btn-sm btn-link p-0 ms-1"
                @click="emit('retry', line.skuId)"
              >
                Thử lại
              </button>
            </template>
          </div>
          <div
            v-else-if="line.stock < line.quantity"
            class="alert alert-subtle-warning py-1 px-2 mb-2 fs-10"
            role="status"
          >
            Tồn kho: {{ line.stock }} (Đơn hàng sẽ ghi nhận xuất âm kho)
          </div>
          <div class="d-flex align-items-center justify-content-between gap-3">
            <div
              class="btn-group btn-group-sm"
              role="group"
              :aria-label="`Số lượng ${line.productName}`"
            >
              <button
                type="button"
                class="btn btn-phoenix-secondary"
                @click="decrement(line.skuId)"
              >
                −
              </button>
              <span class="btn btn-phoenix-secondary disabled fw-bold px-3">{{
                line.quantity
              }}</span>
              <button
                type="button"
                class="btn btn-phoenix-secondary"
                :disabled="cart.isStockUnverified(line.skuId)"
                @click="increment(line.skuId)"
              >
                +
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-link text-danger text-decoration-none"
              @click="remove(line.skuId)"
            >
              Xóa
            </button>
          </div>
        </div>
      </article>
      <div
        v-if="cart.lines.length"
        class="sales-cart-footer px-3 py-2 border-top border-translucent bg-body-tertiary"
      >
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div class="d-flex flex-wrap align-items-center gap-3 fs-10 text-body-secondary">
            <span v-if="cart.totalWeight > 0">
              Tổng TL bạc: <strong class="text-body-highlight">{{ formatWeight(cart.totalWeight) }}</strong>
            </span>
            <span v-if="cart.totalLaborCost > 0">
              Tổng tiền công: <strong class="text-body-highlight">{{ money(cart.totalLaborCost) }}</strong>
            </span>
            <span v-if="cart.totalPlatingCost > 0">
              Tổng tiền xi: <strong class="text-body-highlight">{{ money(cart.totalPlatingCost) }}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { assetUrl } from "@/request";
import { authenStore } from "@/stores/app-authen";
import { formatMoney, formatNumberValue } from "@/utils/resource-display";
import { useSalesCartStore } from "@/views/Orders/cart";
import type { OrderCartLine } from "@/views/Orders/types";
import {
  calculatePiecePrice,
  calculateWeightedPrice,
} from "@/views/WarehousedGoods/pricing";

const props = withDefaults(defineProps<{ refreshingSkuIds?: string[] }>(), {
  refreshingSkuIds: () => [],
});
const emit = defineEmits<{
  change: [];
  feedback: [message: string];
  retry: [skuId: string];
}>();
const cart = useSalesCartStore();
const auth = authenStore();

const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 });

onMounted(() => {
  void cart.loadSilverPrice();
});

function money(value: number): string {
  return formatMoney(value);
}

function formatWeight(value: unknown): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? `${decimal.format(parsed)} chỉ`
    : "—";
}

interface WeightedBreakdown {
  silverCost: number;
  basePrice: number;
  roundedBasePrice: number;
  rawPrice: number;
  calculatedPrice: number;
  manualDiff: number;
  hasManualAdjustment: boolean;
}

interface PieceBreakdown {
  importPrice: number;
  doublePrice: number;
  multiplier: number;
  discountPercent: number;
  discountLabel: string;
  basePrice: number;
  roundedBasePrice: number;
  rawPrice: number;
  calculatedPrice: number;
  manualDiff: number;
  hasManualAdjustment: boolean;
}

function getWeightedBreakdown(line: OrderCartLine): WeightedBreakdown | null {
  const silverPrice = cart.silverPrice;
  const weight = Number(line.weight);
  if (
    line.pricingType !== "Đồ cân" ||
    silverPrice === null ||
    silverPrice <= 0 ||
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    return null;
  }

  const result = calculateWeightedPrice({
    weight,
    silverPrice,
    laborCost: Number(line.laborCost) || 0,
    platingCost: Number(line.platingCost) || 0,
    customMarks: cart.roundingMarks?.weighted,
  });
  const refPrice = line.originalUnitPrice ?? line.unitPrice;
  const manualDiff = refPrice - result.price;

  return {
    silverCost: result.silverCost,
    basePrice: result.basePrice,
    roundedBasePrice: result.roundedBasePrice,
    rawPrice: result.rawPrice,
    calculatedPrice: result.price,
    manualDiff,
    hasManualAdjustment: Boolean(line.manualPrice),
  };
}

function getPieceBreakdown(line: OrderCartLine): PieceBreakdown | null {
  const importPrice = Number(line.importPrice);
  if (
    line.pricingType !== "Đồ món" ||
    !Number.isFinite(importPrice) ||
    importPrice <= 0
  ) {
    return null;
  }

  const preview = calculatePiecePrice(
    importPrice,
    Number(line.platingCost) || 0,
    Number(line.laborCost) || 0,
    cart.roundingMarks?.piece,
  );
  const doublePrice = importPrice * 2;
  const discountPercent = Math.round(preview.discountRate * 100);
  const discountLabel =
    discountPercent > 0 ? `Giảm ${discountPercent}%` : "Không giảm";
  const refPrice = line.originalUnitPrice ?? line.unitPrice;
  const manualDiff = refPrice - preview.price;

  return {
    importPrice,
    doublePrice,
    multiplier: preview.multiplier,
    discountPercent,
    discountLabel,
    basePrice: preview.basePrice,
    roundedBasePrice: preview.roundedBasePrice,
    rawPrice: preview.rawPrice,
    calculatedPrice: preview.price,
    manualDiff,
    hasManualAdjustment: Boolean(line.manualPrice),
  };
}

function getLineRoundedBasePrice(line: OrderCartLine): number {
  if (line.pricingType === "Đồ món") {
    const piece = getPieceBreakdown(line);
    if (piece) {
      return piece.roundedBasePrice + (Number(line.laborCost) || 0);
    }
  } else if (line.pricingType === "Đồ cân") {
    const weighted = getWeightedBreakdown(line);
    if (weighted) {
      return weighted.roundedBasePrice;
    }
  }
  const refPrice = line.originalUnitPrice ?? line.unitPrice;
  return Math.max(0, refPrice - (Number(line.platingCost) || 0));
}

function isManualPrice(line: OrderCartLine): boolean {
  return Boolean(line.manualPrice);
}

function formatInputNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  return formatNumberValue(value);
}

function getLineDisplayTotal(line: OrderCartLine): number {
  return line.unitPrice * line.quantity;
}

function isLineAdjusted(line: OrderCartLine): boolean {
  return Boolean(
    line.adjustedBy &&
      line.originalUnitPrice !== undefined &&
      line.unitPrice !== line.originalUnitPrice,
  );
}

function onPriceFocus(event: FocusEvent): void {
  const target = event.target as HTMLInputElement | null;
  if (target) target.select();
}

function onPriceInput(line: OrderCartLine, event: Event): void {
  const input = event.target as HTMLInputElement;
  const rawDigits = input.value.replace(/\D/g, "");
  if (!rawDigits) return;
  const numericTotal = Number(rawDigits);
  input.value = formatNumberValue(numericTotal);
  cart.setLinePrice(line.skuId, numericTotal, auth.displayName);
  emit("change");
}

function onPriceBlur(line: OrderCartLine, event: Event): void {
  const input = event.target as HTMLInputElement;
  const rawDigits = input.value.replace(/\D/g, "");
  if (!rawDigits || Number(rawDigits) <= 0) {
    cart.resetLinePrice(line.skuId);
    emit("change");
  }
  input.value = formatInputNumber(getLineDisplayTotal(line));
}

function resetLinePrice(line: OrderCartLine): void {
  cart.resetLinePrice(line.skuId);
  emit("change");
}

function isRefreshing(skuId: string): boolean {
  return props.refreshingSkuIds.includes(skuId);
}
function increment(skuId: string): void {
  const result = cart.increment(skuId);
  if (!result.ok) emit("feedback", result.message);
  emit("change");
}
function decrement(skuId: string): void {
  cart.decrement(skuId);
  emit("change");
}
function remove(skuId: string): void {
  cart.remove(skuId);
  emit("change");
}
</script>

<style scoped>
.sales-cart-card {
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--phoenix-border-color-translucent);
}
.sales-cart-lines {
  display: grid;
}
.sales-cart-line {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid var(--phoenix-border-color-translucent);
}
.sales-cart-thumb {
  width: 5.5rem;
  height: 5.5rem;
  object-fit: cover;
  border-radius: 0.75rem;
  background: var(--phoenix-tertiary-bg);
}
.sales-cart-copy {
  min-width: 0;
}
.sku-cost-card {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.sku-definition-list {
  display: grid;
  gap: 0;
}
.sku-definition-list div {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  padding-block: 0.45rem;
  border-bottom: 1px solid var(--phoenix-border-color-translucent);
}
.sku-definition-list div:last-child {
  border-bottom: 0;
}
.sku-definition-list hr.sku-definition-divider {
  border: 0;
  border-top: 1px dashed var(--phoenix-border-color);
  margin: 0.35rem 0;
  opacity: 0.65;
}
.sku-definition-list dt {
  margin: 0;
  color: var(--phoenix-body-secondary);
  font-size: 0.78rem;
  font-weight: 500;
}
.sku-definition-list dd {
  margin: 0;
  text-align: right;
  color: var(--phoenix-body-highlight);
  font-size: 0.8rem;
  font-weight: 600;
}
.sku-definition-list .is-emphasis dt {
  color: var(--phoenix-body-color);
  font-weight: 700;
}
.sku-definition-list .is-emphasis dd {
  color: var(--phoenix-success);
  font-size: 0.88rem;
  font-weight: 700;
}
.sku-definition-list .is-subtotal {
  background: rgba(var(--phoenix-tertiary-bg-rgb, 120, 130, 140), 0.08);
  padding: 0.35rem 0.5rem;
  border-radius: 0.375rem;
  margin-top: 0.25rem;
  font-weight: 600;
}
.sku-definition-list .is-subtotal dt {
  color: var(--phoenix-body-color);
  font-weight: 600;
}
.sku-definition-list .is-subtotal dd {
  color: var(--phoenix-body-highlight);
  font-weight: 700;
}
.sku-definition-hint {
  font-size: 0.68rem;
  font-weight: 400;
  line-height: 1.25;
  margin-top: 0.1rem;
}
.sales-cart-empty-icon {
  display: inline-grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  border-radius: 50%;
  color: var(--phoenix-primary);
  background: rgba(var(--phoenix-primary-rgb), 0.1);
}
@media (max-width: 575.98px) {
  .sales-cart-line {
    grid-template-columns: 4.5rem minmax(0, 1fr);
    padding: 0.875rem;
  }
  .sales-cart-thumb {
    width: 4.5rem;
    height: 4.5rem;
  }
}
.sales-cart-price-input-group {
  max-width: 145px;
}
.sales-cart-price-input-group .form-control {
  padding-right: 0.5rem;
}
.sales-cart-price-input-group .form-control:focus {
  border-color: var(--phoenix-primary);
  box-shadow: 0 0 0 0.2rem rgba(var(--phoenix-primary-rgb), 0.2);
}
</style>

