<template>
  <article class="card h-100 queue-card">
    <ResourceImageCard
      :src="assetUrl(order.thumbnail)"
      :alt="order.orderCode"
      @preview="$emit('preview', assetUrl(order.thumbnail))"
    />
    <div class="card-body d-flex flex-column">
      <div class="d-flex align-items-start justify-content-between gap-2 mb-3">
        <div>
          <RouterLink :to="`/orders/${order.id}`" class="text-decoration-none">
            <code class="order-code-link">{{ order.orderCode }}</code>
          </RouterLink>
          <h2 class="fs-8 mt-1 mb-0">{{ money(order.price) }}</h2>
        </div>
        <div class="d-flex flex-column align-items-end gap-1">
          <OrderStatusBadge
            v-if="showOrderStatus && order.status"
            :status="order.status"
          />
          <CustomerInfoStatusBadge
            v-if="order.customerInfoStatus"
            :status="order.customerInfoStatus"
          />
        </div>
      </div>
      <dl class="queue-facts">
        <div>
          <dt>Khách hàng</dt>
          <dd>{{ order.name || "Chưa có tên" }}</dd>
        </div>
        <div>
          <dt>Điện thoại</dt>
          <dd>{{ order.phone || "Chưa có số" }}</dd>
        </div>
        <div>
          <dt>Sản phẩm</dt>
          <dd>{{ order.itemQuantity || (order.items && order.items.length) || 0 }} món</dd>
        </div>
        <div>
          <dt>Ngày bán</dt>
          <dd>{{ dateTime(order.createdAt) }}</dd>
        </div>
      </dl>
      <div class="d-flex flex-wrap gap-2 mt-auto">
        <button
          v-if="canReview"
          type="button"
          class="btn btn-sm btn-primary flex-grow-1"
          @click="$emit('review', order)"
        >
          {{ actionLabel }}
        </button>
        <RouterLink
          class="btn btn-sm btn-phoenix-secondary"
          :class="{ 'flex-grow-1': !canReview }"
          :to="`/orders/${order.id}`"
        >
          Chi tiết
        </RouterLink>
        <button
          v-if="canDelete"
          type="button"
          class="btn btn-sm btn-phoenix-danger"
          @click="$emit('delete', order)"
        >
          Hủy
        </button>
        <button
          v-if="canRestore"
          type="button"
          class="btn btn-sm btn-phoenix-success"
          @click="$emit('restore', order)"
        >
          Khôi phục
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import ResourceImageCard from "@/components/media/ResourceImageCard.vue";
import CustomerInfoStatusBadge from "@/views/Orders/components/CustomerInfoStatusBadge.vue";
import OrderStatusBadge from "@/views/Orders/components/OrderStatusBadge.vue";
import type { Order } from "@/views/Orders/types";
import { assetUrl } from "@/request";
import { formatDateTime, formatMoney } from "@/utils/resource-display";

const props = withDefaults(
  defineProps<{
    order: Order;
    showOrderStatus?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    canRestore?: boolean;
  }>(),
  {
    showOrderStatus: true,
    canUpdate: false,
    canDelete: false,
    canRestore: false,
  },
);

defineEmits<{
  preview: [url: string];
  review: [order: Order];
  delete: [order: Order];
  restore: [order: Order];
}>();

const canReview = computed(() => {
  if (!props.canUpdate) return false;
  return props.order.customerInfoStatus !== "complete";
});

const actionLabel = computed(() => {
  return props.order.customerInfoStatus === "review_required"
    ? "Kiểm duyệt"
    : "Nhập thông tin";
});

function money(value: number): string {
  return formatMoney(value);
}

function dateTime(value?: string): string {
  return formatDateTime(value);
}
</script>

<style scoped>
.queue-card {
  overflow: hidden;
  border: 1px solid var(--phoenix-border-color-translucent);
}

.queue-facts {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.queue-facts div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px dashed var(--phoenix-border-color-translucent);
}

.queue-facts dt {
  color: var(--phoenix-secondary-color);
  font-size: 0.75rem;
  font-weight: 500;
}

.queue-facts dd {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: right;
}

.order-code-link {
  transition: color 150ms ease;
}

.order-code-link:hover {
  color: var(--phoenix-primary) !important;
  text-decoration: underline;
}
</style>
