<template>
  <section
    v-if="pendingCount || failedItems.length || error"
    class="alert alert-subtle-warning mb-3 py-2"
    aria-label="Trạng thái lưu đơn"
    aria-live="polite"
  >
    <div class="d-flex align-items-center justify-content-between gap-2">
      <span v-if="pendingCount"
        >Đang lưu {{ pendingCount }} đơn · Bạn có thể tiếp tục bán.</span
      >
      <strong v-else-if="failedItems.length" class="text-danger"
        >{{ failedItems.length }} đơn chưa lưu thành công</strong
      >
      <span v-else>Chưa kiểm tra được trạng thái lưu đơn</span>
      <button
        class="btn btn-sm btn-link"
        type="button"
        :disabled="loading"
        @click="refresh"
      >
        {{ loading ? "Đang cập nhật…" : "Cập nhật" }}
      </button>
    </div>
    <p v-if="error" class="text-danger mb-0" role="alert">{{ error }}</p>
    <ul v-if="failedItems.length" class="list-unstyled mb-0">
      <li
        v-for="item in failedItems"
        :key="item.requestId"
        class="d-flex align-items-start gap-2 border-top py-2"
      >
        <img
          :src="assetUrl(item.thumbnail)"
          alt="Ảnh đơn chưa lưu thành công"
          class="request-photo"
        />
        <div class="flex-grow-1">
          <strong
            >{{ item.name || "Khách lẻ" }} · {{ quantity(item) }} món</strong
          >
          <small class="d-block text-body-tertiary">{{
            time(item.createdAt)
          }}</small>
          <p class="text-danger mb-1">
            {{ item.error?.message || "Chưa thể hoàn tất đơn." }}
          </p>
          <small
            >Thử lại dùng đúng ảnh và sản phẩm đã gửi, không dùng giỏ hàng hiện
            tại.</small
          >
        </div>
        <button
          class="btn btn-sm btn-phoenix-warning text-nowrap"
          type="button"
          :disabled="retrying.includes(item.requestId)"
          @click="retry(item)"
        >
          {{ retrying.includes(item.requestId) ? "Đang gửi…" : "Thử lại" }}
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { apiError, assetUrl } from "@/request";
import { orderService } from "@/views/Orders/service";
import type { CheckoutRequest } from "@/views/Orders/types";

const props = defineProps<{ latest?: CheckoutRequest | null }>();
const emit = defineEmits<{
  updated: [value: CheckoutRequest];
  completed: [];
}>();
const items = ref<CheckoutRequest[]>([]);
const loading = ref(false);
const error = ref("");
const retrying = ref<string[]>([]);
const controller = new AbortController();
let timer: ReturnType<typeof setTimeout> | undefined;
let revision = 0;
const pendingCount = computed(
  () =>
    items.value.filter(
      (item) => item.status === "pending" || item.status === "processing",
    ).length,
);
const failedItems = computed(() =>
  items.value.filter((item) => item.status === "failed"),
);

function quantity(item: CheckoutRequest): number {
  return item.items.reduce((sum, line) => sum + line.quantity, 0);
}
function time(value: string): string {
  return new Date(value).toLocaleString("vi-VN");
}
function upsert(item: CheckoutRequest): void {
  revision += 1;
  items.value = [
    item,
    ...items.value.filter((row) => row.requestId !== item.requestId),
  ];
}
async function refresh(): Promise<void> {
  if (loading.value || controller.signal.aborted || document.hidden) return;
  clearTimeout(timer);
  loading.value = true;
  const startedRevision = revision;
  const previous = items.value.filter((item) => item.status !== "completed");
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
    // Resolve only tracked requests that left the active list; the API has no batch detail endpoint.
    const resolved: CheckoutRequest[] = [];
    for (const item of previous) {
      if (!active.some((row) => row.requestId === item.requestId))
        resolved.push(
          await orderService.checkoutRequest(item.requestId, controller.signal),
        );
    }
    if (controller.signal.aborted || revision !== startedRevision) return;
    items.value = [...active, ...resolved];
    if (resolved.some((item) => item.status === "completed")) emit("completed");
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
      timer = setTimeout(
        () => void refresh(),
        processing || revision !== startedRevision
          ? 3000
          : error.value
            ? 15000
            : 60000,
      );
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
  { immediate: true },
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
