<template>
  <section class="card mb-3" aria-label="Đơn đã tiếp nhận">
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
        <h2 class="fs-8 mb-0">Đơn đã tiếp nhận của bạn</h2>
        <button
          class="btn btn-sm btn-link"
          type="button"
          :disabled="loading"
          @click="refresh"
        >
          {{ loading ? "Đang cập nhật…" : "Cập nhật" }}
        </button>
      </div>
      <p class="fs-10 text-body-tertiary mb-2">
        Đơn đang xử lý chưa được tính vào doanh thu. Bạn có thể tiếp tục bán đơn
        mới.
      </p>
      <div v-if="error" class="alert alert-subtle-warning py-2" role="alert">
        {{ error }}
      </div>
      <p v-if="!items.length && !loading && !error" class="fs-9 mb-0">
        Chưa có yêu cầu ghi nhận đơn.
      </p>
      <ul v-if="items.length" class="list-unstyled mb-0">
        <li
          v-for="item in items"
          :key="item.requestId"
          class="d-flex align-items-start gap-3 border-top py-3"
        >
          <img
            :src="assetUrl(item.thumbnail)"
            alt="Ảnh đơn đã tiếp nhận"
            class="request-photo"
          />
          <div class="flex-grow-1">
            <strong
              :class="
                item.status === 'failed'
                  ? 'text-danger'
                  : item.status === 'completed'
                    ? 'text-success'
                    : 'text-primary'
              "
            >
              {{ labels[item.status] }}
            </strong>
            <p class="fs-9 mb-1">
              {{ item.name || "Khách lẻ" }} · {{ quantity(item) }} món
            </p>
            <small class="text-body-tertiary">{{ time(item.createdAt) }}</small>
            <p v-if="item.error" class="text-danger fs-9 mb-1">
              {{ item.error.message }}
            </p>
            <p v-if="item.status === 'failed'" class="fs-10 mb-0">
              Thử lại dùng đúng ảnh và sản phẩm đã gửi. Sửa giỏ hàng hiện tại
              không thay đổi yêu cầu này.
            </p>
          </div>
          <RouterLink
            v-if="
              item.status === 'completed' &&
              item.orderId &&
              auth.can('orders.view')
            "
            :to="`/orders/${item.orderId}`"
            class="btn btn-sm btn-phoenix-secondary text-nowrap"
            >Xem đơn</RouterLink
          >
          <button
            v-else-if="item.status === 'failed'"
            class="btn btn-sm btn-phoenix-warning text-nowrap"
            type="button"
            :disabled="retrying.includes(item.requestId)"
            @click="retry(item)"
          >
            {{ retrying.includes(item.requestId) ? "Đang gửi…" : "Thử lại" }}
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { apiError, assetUrl } from "@/request";
import { authenStore } from "@/stores/app-authen";
import { orderService } from "@/views/Orders/service";
import type { CheckoutRequest } from "@/views/Orders/types";

const props = defineProps<{ latest?: CheckoutRequest | null }>();
const emit = defineEmits<{ updated: [value: CheckoutRequest] }>();
const auth = authenStore();
const items = ref<CheckoutRequest[]>([]);
const loading = ref(false);
const error = ref("");
const retrying = ref<string[]>([]);
const controller = new AbortController();
let timer: ReturnType<typeof setTimeout> | undefined;
const labels = {
  pending: "Đã tiếp nhận",
  processing: "Đang xử lý",
  completed: "Đã hoàn tất",
  failed: "Chưa thể hoàn tất",
};

function quantity(item: CheckoutRequest): number {
  return item.items.reduce((sum, line) => sum + line.quantity, 0);
}
function time(value: string): string {
  return new Date(value).toLocaleString("vi-VN");
}
function upsert(item: CheckoutRequest): void {
  items.value = [
    item,
    ...items.value.filter((row) => row.requestId !== item.requestId),
  ];
}
async function refresh(): Promise<void> {
  if (loading.value || controller.signal.aborted || document.hidden) return;
  clearTimeout(timer);
  loading.value = true;
  try {
    const active: CheckoutRequest[] = [];
    let cursor: string | undefined;
    // Follow server pagination so older failed requests never disappear behind newer sales.
    do {
      const page = await orderService.checkoutRequests(
        "active",
        cursor,
        controller.signal,
      );
      active.push(...page.items);
      cursor = page.nextCursor || undefined;
    } while (cursor);
    const completed = await orderService.checkoutRequests(
      "completed",
      undefined,
      controller.signal,
    );
    if (controller.signal.aborted) return;
    items.value = [
      ...new Map(
        [...active, ...completed.items.slice(0, 5)].map((item) => [
          item.requestId,
          item,
        ]),
      ).values(),
    ];
    const latest = items.value.find(
      (item) => item.requestId === props.latest?.requestId,
    );
    if (
      latest &&
      (latest.status !== props.latest?.status ||
        latest.updatedAt !== props.latest?.updatedAt)
    )
      emit("updated", latest);
    error.value = "";
  } catch (cause) {
    if (!controller.signal.aborted)
      error.value = `Chưa cập nhật được trạng thái đơn. ${apiError(cause).message}`;
  } finally {
    loading.value = false;
    if (!controller.signal.aborted && !document.hidden) {
      const processing = items.value.some(
        (item) => item.status === "pending" || item.status === "processing",
      );
      timer = setTimeout(() => void refresh(), processing ? 3000 : 15000);
    }
  }
}
async function retry(item: CheckoutRequest): Promise<void> {
  if (retrying.value.includes(item.requestId)) return;
  retrying.value.push(item.requestId);
  try {
    const updated = await orderService.retryCheckout(item.requestId);
    if (!controller.signal.aborted) {
      upsert(updated);
      if (!loading.value) {
        clearTimeout(timer);
        timer = setTimeout(() => void refresh(), 3000);
      }
      if (updated.requestId === props.latest?.requestId)
        emit("updated", updated);
      error.value = "";
    }
  } catch (cause) {
    if (!controller.signal.aborted) error.value = apiError(cause).message;
  } finally {
    retrying.value = retrying.value.filter((id) => id !== item.requestId);
  }
}
watch(
  () => props.latest,
  (item) => {
    if (item) {
      upsert(item);
      if (!loading.value) {
        clearTimeout(timer);
        timer = setTimeout(() => void refresh(), 3000);
      }
    }
  },
);
function visibilityChanged(): void {
  clearTimeout(timer);
  if (!document.hidden) void refresh();
}
onMounted(() => {
  document.addEventListener("visibilitychange", visibilityChanged);
  void refresh();
});
onBeforeUnmount(() => {
  controller.abort();
  clearTimeout(timer);
  document.removeEventListener("visibilitychange", visibilityChanged);
});
</script>

<style scoped>
.request-photo {
  width: 3.5rem;
  height: 4.5rem;
  border-radius: 0.5rem;
  object-fit: cover;
}
</style>
