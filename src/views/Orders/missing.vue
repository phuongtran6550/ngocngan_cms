<template>
  <section>
    <PageHeader title="Bổ sung thông tin khách hàng" description="Đây là các đơn đã bán hoàn tất và đã trừ tồn kho; chỉ còn tên hoặc số điện thoại cần xử lý sau.">
      <template #actions>
        <RouterLink class="btn btn-phoenix-secondary" to="/orders">Danh sách đơn</RouterLink>
        <RouterLink v-if="auth.can('orders.create')" class="btn btn-primary" to="/orders/create">Bán hàng</RouterLink>
      </template>
    </PageHeader>

    <div class="queue-filters mb-3">
      <button type="button" class="btn btn-sm" :class="filterClass('')" @click="filter('')">Tất cả</button>
      <button type="button" class="btn btn-sm" :class="filterClass('ocr_processing')" @click="filter('ocr_processing')">OCR đang chạy</button>
      <button type="button" class="btn btn-sm" :class="filterClass('review_required')" @click="filter('review_required')">Cần kiểm duyệt</button>
      <button type="button" class="btn btn-sm" :class="filterClass('manual_required')" @click="filter('manual_required')">Nhập thủ công</button>
    </div>
    <div v-if="message" class="alert alert-subtle-success" role="status">{{ message }}</div>
    <div v-if="store.error" class="alert alert-subtle-danger" role="alert">{{ store.error }}</div>
    <LoadingSkeleton v-if="store.missingLoading" />
    <div v-else-if="!store.missingItems.length" class="card"><div class="card-body text-center py-6"><h2 class="fs-7">Không còn đơn cần bổ sung</h2><p class="text-body-tertiary mb-0">Hàng chờ hiện đã được xử lý hết.</p></div></div>
    <div v-else class="row g-3">
      <div v-for="order in store.missingItems" :key="order.id" class="col-12 col-md-6 col-xl-4">
        <article class="card h-100 queue-card">
          <ResourceImageCard :src="assetUrl(order.thumbnail)" :alt="order.orderCode" @preview="preview = assetUrl(order.thumbnail)" />
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-start justify-content-between gap-2 mb-3">
              <div><code>{{ order.orderCode }}</code><h2 class="fs-8 mt-1 mb-0">{{ money(order.price) }}</h2></div>
              <CustomerInfoStatusBadge :status="order.customerInfoStatus" />
            </div>
            <dl class="queue-facts">
              <div><dt>Khách hàng</dt><dd>{{ order.name || "Chưa có tên" }}</dd></div>
              <div><dt>Điện thoại</dt><dd>{{ order.phone || "Chưa có số" }}</dd></div>
              <div><dt>Sản phẩm</dt><dd>{{ order.itemQuantity || order.items.length }} món</dd></div>
              <div><dt>Ngày bán</dt><dd>{{ dateTime(order.createdAt) }}</dd></div>
            </dl>
            <div class="d-flex flex-wrap gap-2 mt-auto">
              <button v-if="auth.can('orders.update')" type="button" class="btn btn-sm btn-primary flex-grow-1" @click="openReview(order)">{{ actionLabel(order) }}</button>
              <RouterLink class="btn btn-sm btn-phoenix-secondary" :to="`/orders/${order.id}`">Chi tiết</RouterLink>
              <button v-if="auth.can('orders.delete') && order.status === 'completed'" type="button" class="btn btn-sm btn-phoenix-danger" @click="cancelTarget = order">Hủy</button>
            </div>
          </div>
        </article>
      </div>
    </div>
    <PaginationBar :page="store.missingPagination.page" :total-pages="store.missingPagination.totalPages" :total="store.missingPagination.total" @change="loadQueue" />

    <DrawerPanel :open="Boolean(editing)" title="Đối chiếu thông tin khách hàng" wide @close="closeReview">
      <OrderCustomerReview v-if="editing" :order="editing" :submitting="saving" :error="editError" @submit="save" />
    </DrawerPanel>
    <ConfirmDialog :open="Boolean(cancelTarget)" title="Hủy đơn hàng" message="Đơn đã bán sẽ chuyển sang trạng thái hủy và toàn bộ SKU của đơn được hoàn lại tồn kho." confirm-label="Hủy và hoàn tồn" @cancel="cancelTarget = null" @confirm="cancelOrder" />
    <ImagePreview :src="preview" alt="Ảnh đơn hàng" @close="preview = ''" />
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import ImagePreview from "@/components/media/ImagePreview.vue";
import ResourceImageCard from "@/components/media/ResourceImageCard.vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import PaginationBar from "@/components/Pagination/index.vue";
import CustomerInfoStatusBadge from "@/views/Orders/components/CustomerInfoStatusBadge.vue";
import OrderCustomerReview from "@/views/Orders/components/OrderCustomerReview.vue";
import { orderService } from "@/views/Orders/service";
import { useOrderStore } from "@/views/Orders/store";
import type { CustomerInfoStatus, Order } from "@/views/Orders/types";
import { apiError, assetUrl } from "@/request";
import { authenStore } from "@/stores/app-authen";
import { formatDateTime, formatMoney } from "@/utils/resource-display";

export default defineComponent({
  name: "OrderMissingPage",
  components: { ConfirmDialog, CustomerInfoStatusBadge, DrawerPanel, ImagePreview, LoadingSkeleton, OrderCustomerReview, PageHeader, PaginationBar, ResourceImageCard },
  data() {
    return {
      editing: null as Order | null,
      cancelTarget: null as Order | null,
      saving: false,
      editError: "",
      message: "",
      preview: "",
      pollTimer: null as ReturnType<typeof setTimeout> | null,
      pollingDisposed: false,
    };
  },
  computed: {
    store() { return useOrderStore(); },
    auth() { return authenStore(); },
    hasProcessingOrders(): boolean {
      return this.store.missingItems.some((order) => order.customerInfoStatus === "ocr_processing");
    },
  },
  mounted() {
    this.pollingDisposed = false;
    this.store.customerInfoStatus = "";
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    void this.loadQueue(1);
  },
  beforeUnmount() {
    this.pollingDisposed = true;
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.stopPolling();
  },
  methods: {
    assetUrl,
    money(value: number): string { return formatMoney(value); },
    dateTime(value?: string): string { return formatDateTime(value); },
    actionLabel(order: Order): string { return order.customerInfoStatus === "review_required" ? "Kiểm duyệt" : "Nhập thông tin"; },
    filterClass(value: string): string { return this.store.customerInfoStatus === value ? "btn-primary" : "btn-phoenix-secondary"; },
    async loadQueue(page: number): Promise<void> {
      await this.store.loadMissing(page);
      this.schedulePolling();
    },
    stopPolling(): void {
      if (this.pollTimer) clearTimeout(this.pollTimer);
      this.pollTimer = null;
    },
    schedulePolling(): void {
      this.stopPolling();
      if (this.pollingDisposed || document.hidden || !this.hasProcessingOrders) return;
      this.pollTimer = setTimeout(async () => {
        await this.store.refreshMissing();
        if (this.pollingDisposed) return;
        this.schedulePolling();
      }, 8000);
    },
    handleVisibilityChange(): void {
      if (document.hidden) this.stopPolling();
      else this.schedulePolling();
    },
    async filter(value: string): Promise<void> {
      this.store.customerInfoStatus = value as CustomerInfoStatus | "";
      await this.loadQueue(1);
    },
    async openReview(order: Order): Promise<void> { this.editError = ""; try { this.editing = await orderService.detail(order.id); } catch (error) { this.store.error = apiError(error).message; } },
    closeReview(): void { this.editing = null; this.editError = ""; },
    async save(value: { name: string; phone: string; review: boolean }): Promise<void> {
      if (!this.editing) return;
      this.saving = true; this.editError = "";
      try {
        await (value.review
          ? orderService.reviewCustomerInfo(this.editing.id, value.name, value.phone)
          : orderService.completeCustomerInfo(this.editing.id, value.name, value.phone));
        this.closeReview(); this.message = "Đã xác nhận thông tin khách hàng";
        await Promise.all([this.store.loadMissing(this.store.missingPagination.page), this.store.loadCounts()]);
        this.schedulePolling();
      } catch (error) { this.editError = apiError(error).message; }
      finally { this.saving = false; }
    },
    async cancelOrder(): Promise<void> {
      const target = this.cancelTarget; if (!target) return; this.cancelTarget = null;
      try { await orderService.remove(target.id); this.message = "Đã hủy đơn và hoàn tồn kho"; await Promise.all([this.store.loadMissing(this.store.missingPagination.page), this.store.loadCounts()]); this.schedulePolling(); }
      catch (error) { this.store.error = apiError(error).message; }
    },
  },
});
</script>

<style scoped>
.queue-filters { display: flex; gap: .5rem; overflow-x: auto; }
.queue-filters .btn { flex: 0 0 auto; white-space: nowrap; }
.queue-card { overflow: hidden; border: 1px solid var(--phoenix-border-color-translucent); }
.queue-facts { display: grid; gap: .65rem; margin-bottom: 1rem; }
.queue-facts div { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: .55rem; border-bottom: 1px dashed var(--phoenix-border-color-translucent); }
.queue-facts dt { color: var(--phoenix-secondary-color); font-size: .75rem; font-weight: 500; }
.queue-facts dd { margin: 0; font-size: .8rem; font-weight: 700; text-align: right; }
</style>
