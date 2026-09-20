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
            <strong class="text-nowrap">{{
              money(line.unitPrice * line.quantity)
            }}</strong>
          </div>
          <p class="fs-10 text-body-tertiary mb-2">
            {{ money(line.unitPrice) }} / món · Tồn {{ line.stock }}
          </p>
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
    </div>
  </section>
</template>

<script setup lang="ts">
import AppIcon from "@/components/ui/AppIcon.vue";
import { assetUrl } from "@/request";
import { formatMoney } from "@/utils/resource-display";
import { useSalesCartStore } from "@/views/Orders/cart";

const props = withDefaults(defineProps<{ refreshingSkuIds?: string[] }>(), {
  refreshingSkuIds: () => [],
});
const emit = defineEmits<{
  change: [];
  feedback: [message: string];
  retry: [skuId: string];
}>();
const cart = useSalesCartStore();

function money(value: number): string {
  return formatMoney(value);
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
