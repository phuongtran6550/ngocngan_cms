<template>
  <section class="card sales-cart-card">
    <div
      class="card-header bg-transparent d-flex flex-wrap align-items-center justify-content-between gap-3"
    >
      <div>
        <h2 class="fs-7 mb-1">Giỏ hàng</h2>
        <p class="fs-10 text-body-tertiary mb-0">
          Giá bán lấy trực tiếp từ kho và không thể chỉnh sửa.
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
          <div class="d-flex align-items-start justify-content-between gap-2">
            <div>
              <h3 class="fs-9 mb-1">{{ line.productName }}</h3>
              <code class="fs-10">{{ line.skuCode || line.barcode }}</code>
            </div>
            <div class="text-end">
              <strong class="text-nowrap d-block">{{
                money(line.unitPrice * line.quantity)
              }}</strong>
              <small
                v-if="line.rawPrice !== undefined && line.rawPrice !== null"
                class="text-body-tertiary text-nowrap d-block fs-10"
              >
                Tạm tính: {{ money(line.rawPrice * line.quantity) }}
              </small>
            </div>
          </div>
          <div class="fs-10 text-body-tertiary mb-2">
            <div>{{ money(line.unitPrice) }} / món · Tồn {{ line.stock }}</div>
            <div
              v-if="line.rawPrice !== undefined && line.rawPrice !== null"
              class="d-flex flex-wrap align-items-center gap-1 mt-1"
            >
              <span>Tạm tính (chưa làm tròn):</span>
              <strong class="text-warning-emphasis fw-bold">{{ money(line.rawPrice) }} / món</strong>
              <span v-if="line.unitPrice !== line.rawPrice" class="text-body-tertiary">
                ({{ line.unitPrice > line.rawPrice ? '+' : '' }}{{ money(line.unitPrice - line.rawPrice) }})
              </span>
            </div>
          </div>

          <!-- Chi phí SKU -->
          <div class="sales-cart-cost-card my-2 p-2 rounded-2 border border-translucent bg-body-tertiary">
            <div class="d-flex align-items-center justify-content-between gap-2">
              <div class="d-flex align-items-center gap-2">
                <span class="fs-10 fw-bold text-uppercase text-body-secondary">Chi phí SKU</span>
                <span
                  class="badge badge-phoenix"
                  :class="
                    line.pricingType === 'Đồ cân'
                      ? 'badge-phoenix-info'
                      : line.pricingType === 'Đồ món'
                        ? 'badge-phoenix-warning'
                        : 'badge-phoenix-secondary'
                  "
                >
                  {{ line.pricingType || "Chưa phân loại" }}
                </span>
              </div>
              <button
                type="button"
                class="btn btn-sm btn-link p-0 text-decoration-none fs-10 d-inline-flex align-items-center gap-1 text-body-secondary"
                :aria-expanded="isCostExpanded(line.skuId)"
                @click="toggleCost(line.skuId)"
              >
                <span>{{ isCostExpanded(line.skuId) ? "Thu gọn" : "Chi tiết" }}</span>
                <AppIcon :name="isCostExpanded(line.skuId) ? 'chevron-up' : 'chevron-down'" />
              </button>
            </div>

            <!-- Dòng tóm tắt nhanh chi phí -->
            <div class="d-flex flex-wrap align-items-center gap-x-3 gap-y-1 mt-1 fs-10 text-body-secondary">
              <template v-if="line.pricingType === 'Đồ cân'">
                <span v-if="line.weight">Trọng lượng: <strong class="text-body-highlight">{{ formatWeight(line.weight) }}</strong></span>
                <span v-if="cart.silverPrice">Giá bạc: <strong class="text-body-highlight">{{ money(cart.silverPrice) }}/chỉ</strong></span>
                <span v-if="line.laborCost && line.laborCost > 0">Tiền công: <strong class="text-body-highlight">{{ money(line.laborCost) }}</strong></span>
                <span v-if="line.platingCost && line.platingCost > 0">Tiền xi: <strong class="text-body-highlight">{{ money(line.platingCost) }}</strong></span>
              </template>
              <template v-else-if="line.pricingType === 'Đồ món'">
                <span v-if="line.importPrice !== null && line.importPrice !== undefined && line.importPrice > 0">Giá nhập: <strong class="text-body-highlight">{{ money(line.importPrice) }}</strong></span>
                <span v-if="getPieceBreakdown(line)">Hệ số: <strong class="text-body-highlight">x{{ getPieceBreakdown(line)?.multiplier }}</strong></span>
                <span v-if="line.laborCost && line.laborCost > 0">Tiền công: <strong class="text-body-highlight">{{ money(line.laborCost) }}</strong></span>
                <span v-if="line.platingCost && line.platingCost > 0">Tiền xi: <strong class="text-body-highlight">{{ money(line.platingCost) }}</strong></span>
              </template>
              <template v-else>
                <span v-if="line.importPrice !== null && line.importPrice !== undefined && line.importPrice > 0">Giá nhập: <strong class="text-body-highlight">{{ money(line.importPrice) }}</strong></span>
                <span v-if="line.laborCost && line.laborCost > 0">Tiền công: <strong class="text-body-highlight">{{ money(line.laborCost) }}</strong></span>
                <span v-if="line.platingCost && line.platingCost > 0">Tiền xi: <strong class="text-body-highlight">{{ money(line.platingCost) }}</strong></span>
              </template>
            </div>

            <!-- Bảng phân rã chi tiết (Mở rộng / Thu gọn) -->
            <div v-if="isCostExpanded(line.skuId)" class="sales-cart-cost-details mt-2 pt-2 border-top border-translucent">
              <!-- Đồ cân -->
              <template v-if="line.pricingType === 'Đồ cân'">
                <dl class="sku-mini-definition-list mb-0">
                  <div>
                    <dt>Giá Bạc</dt>
                    <dd>{{ cart.silverPrice ? `${money(cart.silverPrice)} / chỉ` : "Chưa cấu hình" }}</dd>
                  </div>
                  <div>
                    <dt>Trọng lượng</dt>
                    <dd>{{ formatWeight(line.weight) }}</dd>
                  </div>
                  <div>
                    <dt>Tiền công</dt>
                    <dd>{{ money(line.laborCost || 0) }}</dd>
                  </div>
                  <template v-if="getWeightedBreakdown(line)">
                    <div>
                      <dt>
                        CT (Trọng lượng * Giá bạc) + Công
                        <small v-if="cart.silverPrice" class="sku-cost-hint d-block text-body-tertiary">
                          ({{ formatWeight(line.weight) }} × {{ money(cart.silverPrice) }}) + {{ money(line.laborCost || 0) }}
                        </small>
                      </dt>
                      <dd>{{ money(getWeightedBreakdown(line)!.basePrice) }}</dd>
                    </div>
                    <div>
                      <dt>
                        Thành tiền sau làm tròn
                        <small class="sku-cost-hint d-block text-body-tertiary">Bậc giá chuẩn đồ cân</small>
                      </dt>
                      <dd>{{ money(getWeightedBreakdown(line)!.roundedBasePrice) }}</dd>
                    </div>
                  </template>
                  <div v-if="line.platingCost && line.platingCost > 0">
                    <dt>Tiền Xi</dt>
                    <dd>{{ money(line.platingCost) }}</dd>
                  </div>
                  <template v-if="getWeightedBreakdown(line)?.hasManualAdjustment">
                    <div>
                      <dt>
                        Điều chỉnh thủ công
                        <small class="sku-cost-hint d-block text-body-tertiary">Chênh lệch so với giá chuẩn</small>
                      </dt>
                      <dd>
                        {{ getWeightedBreakdown(line)!.manualDiff > 0 ? "+" : "" }}{{ money(getWeightedBreakdown(line)!.manualDiff) }}
                      </dd>
                    </div>
                  </template>
                  <div class="is-emphasis">
                    <dt>Đơn giá 1 món</dt>
                    <dd>{{ money(line.unitPrice) }}</dd>
                  </div>
                  <div v-if="line.quantity > 1" class="is-subtotal">
                    <dt>Tổng chi phí dòng (x{{ line.quantity }} món)</dt>
                    <dd>{{ money(line.unitPrice * line.quantity) }}</dd>
                  </div>
                </dl>
              </template>

              <!-- Đồ món -->
              <template v-else-if="line.pricingType === 'Đồ món'">
                <dl class="sku-mini-definition-list mb-0">
                  <template v-if="getPieceBreakdown(line)">
                    <div>
                      <dt>Giá nhập</dt>
                      <dd>{{ money(getPieceBreakdown(line)!.importPrice) }}</dd>
                    </div>
                    <div>
                      <dt>
                        Giá nhân đôi
                        <small class="sku-cost-hint d-block text-body-tertiary">Mức giá trần (100%)</small>
                      </dt>
                      <dd>{{ money(getPieceBreakdown(line)!.doublePrice) }}</dd>
                    </div>
                    <div>
                      <dt>Hệ số tính giá</dt>
                      <dd>
                        <span class="badge badge-phoenix badge-phoenix-primary me-1">x{{ getPieceBreakdown(line)!.multiplier }}</span>
                        <span class="text-body-secondary fs-10">{{ getPieceBreakdown(line)!.discountLabel }}</span>
                      </dd>
                    </div>
                    <div>
                      <dt>
                        Tiền hàng tạm tính
                        <small class="sku-cost-hint d-block text-body-tertiary">Giá nhập × {{ getPieceBreakdown(line)!.multiplier }}</small>
                      </dt>
                      <dd>{{ money(getPieceBreakdown(line)!.basePrice) }}</dd>
                    </div>
                    <div>
                      <dt>
                        Tiền hàng sau làm tròn
                        <small class="sku-cost-hint d-block text-body-tertiary">Theo bậc giá chuẩn</small>
                      </dt>
                      <dd>{{ money(getPieceBreakdown(line)!.roundedBasePrice) }}</dd>
                    </div>
                    <div v-if="line.platingCost && line.platingCost > 0">
                      <dt>Tiền xi</dt>
                      <dd>{{ money(line.platingCost) }}</dd>
                    </div>
                    <div v-if="line.laborCost && line.laborCost > 0">
                      <dt>Tiền công</dt>
                      <dd>{{ money(line.laborCost) }}</dd>
                    </div>
                    <div>
                      <dt>
                        Tạm tính theo công thức
                        <small class="sku-cost-hint d-block text-body-tertiary">Hàng làm tròn + Xi + Công</small>
                      </dt>
                      <dd>{{ money(getPieceBreakdown(line)!.calculatedPrice) }}</dd>
                    </div>
                    <div v-if="getPieceBreakdown(line)!.hasManualAdjustment">
                      <dt>
                        Điều chỉnh thủ công
                        <small class="sku-cost-hint d-block text-body-tertiary">Chênh lệch so với giá chuẩn</small>
                      </dt>
                      <dd>
                        {{ getPieceBreakdown(line)!.manualDiff > 0 ? "+" : "" }}{{ money(getPieceBreakdown(line)!.manualDiff) }}
                      </dd>
                    </div>
                    <div class="is-emphasis">
                      <dt>Đơn giá 1 món</dt>
                      <dd>{{ money(line.unitPrice) }}</dd>
                    </div>
                    <div v-if="line.quantity > 1" class="is-subtotal">
                      <dt>Tổng chi phí dòng (x{{ line.quantity }} món)</dt>
                      <dd>{{ money(line.unitPrice * line.quantity) }}</dd>
                    </div>
                  </template>
                  <template v-else>
                    <div>
                      <dt>Giá nhập</dt>
                      <dd>{{ line.importPrice !== null && line.importPrice !== undefined && line.importPrice > 0 ? money(line.importPrice) : "Chưa thiết lập" }}</dd>
                    </div>
                    <div v-if="line.platingCost && line.platingCost > 0">
                      <dt>Tiền xi</dt>
                      <dd>{{ money(line.platingCost) }}</dd>
                    </div>
                    <div v-if="line.laborCost && line.laborCost > 0">
                      <dt>Tiền công</dt>
                      <dd>{{ money(line.laborCost) }}</dd>
                    </div>
                  </template>
                </dl>
              </template>

              <!-- Fallback loại khác -->
              <template v-else>
                <dl class="sku-mini-definition-list mb-0">
                  <div v-if="line.importPrice !== null && line.importPrice !== undefined && line.importPrice > 0">
                    <dt>Giá nhập</dt>
                    <dd>{{ money(line.importPrice) }}</dd>
                  </div>
                  <div v-if="line.laborCost && line.laborCost > 0">
                    <dt>Tiền công</dt>
                    <dd>{{ money(line.laborCost) }}</dd>
                  </div>
                  <div v-if="line.platingCost && line.platingCost > 0">
                    <dt>Tiền xi</dt>
                    <dd>{{ money(line.platingCost) }}</dd>
                  </div>
                  <div class="is-emphasis">
                    <dt>Đơn giá</dt>
                    <dd>{{ money(line.unitPrice) }}</dd>
                  </div>
                </dl>
              </template>
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
          <div v-if="cart.rawTotal !== cart.total" class="fs-10 text-body-secondary">
            <span>Tổng tạm tính (chưa làm tròn): </span>
            <strong class="fs-9 text-warning-emphasis">{{ money(cart.rawTotal) }}</strong>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { assetUrl } from "@/request";
import { formatMoney } from "@/utils/resource-display";
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

const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 });
const expandedCostSkuIds = ref<Record<string, boolean>>({});

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

function isCostExpanded(skuId: string): boolean {
  return Boolean(expandedCostSkuIds.value[skuId]);
}

function toggleCost(skuId: string): void {
  expandedCostSkuIds.value[skuId] = !expandedCostSkuIds.value[skuId];
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
  const manualDiff = line.unitPrice - result.price;

  return {
    silverCost: result.silverCost,
    basePrice: result.basePrice,
    roundedBasePrice: result.roundedBasePrice,
    rawPrice: result.rawPrice,
    calculatedPrice: result.price,
    manualDiff,
    hasManualAdjustment: manualDiff !== 0,
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
  const manualDiff = line.unitPrice - preview.price;

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
    hasManualAdjustment: manualDiff !== 0,
  };
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
.sales-cart-cost-card {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.sku-mini-definition-list {
  display: grid;
  gap: 0;
}
.sku-mini-definition-list div {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  padding-block: 0.35rem;
  border-bottom: 1px dashed var(--phoenix-border-color-translucent);
}
.sku-mini-definition-list div:last-child {
  border-bottom: 0;
}
.sku-mini-definition-list dt {
  margin: 0;
  color: var(--phoenix-tertiary-color);
  font-size: 0.72rem;
  font-weight: 600;
}
.sku-mini-definition-list dd {
  margin: 0;
  text-align: right;
  color: var(--phoenix-emphasis-color);
  font-size: 0.75rem;
  font-weight: 600;
}
.sku-mini-definition-list .is-emphasis dt {
  color: var(--phoenix-body-color);
  font-weight: 700;
}
.sku-mini-definition-list .is-emphasis dd {
  color: var(--phoenix-success);
  font-weight: 700;
}
.sku-mini-definition-list .is-subtotal {
  background: rgba(var(--phoenix-tertiary-bg-rgb, 120, 130, 140), 0.08);
  padding: 0.35rem 0.5rem;
  border-radius: 0.25rem;
  margin-top: 0.25rem;
}
.sku-mini-definition-list .is-subtotal dt {
  color: var(--phoenix-body-color);
  font-weight: 700;
}
.sku-mini-definition-list .is-subtotal dd {
  color: var(--phoenix-primary);
  font-weight: 700;
}
.sku-cost-hint {
  font-size: 0.68rem;
  font-weight: 400;
  line-height: 1.2;
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
</style>

