<template>
  <div>
    <CheckoutRequests v-if="auth.can('orders.create')" :key="auth.user?.id" @completed="refreshCompletedOrders" />
    <div v-if="store.message" class="alert alert-subtle-success" role="status">{{ store.message }}</div>
    <ListShell
      :definition="effectiveDefinition"
      :rows="rows"
      :pagination="store.pagination"
      :loading="store.loading"
      :error="store.error"
      :selected-columns="store.selectedColumns"
      :can-delete-row="canDeleteRow"
      :can-restore-row="canRestoreRow"
      @create="$router.push('/orders/create')"
      @refresh="store.load"
      @fields="updateFields"
      @sort="store.applySort"
      @view="openDetail"
      @delete="requestDelete"
      @restore="requestRestore"
      @page="store.load"
    >
      <template #header-actions>
        <div class="d-flex flex-wrap gap-2">
          <RouterLink
            class="btn btn-sm btn-phoenix-warning text-nowrap"
            to="/orders/missing"
          >
            Chờ xử lý {{ incompleteCount }}
          </RouterLink>
          <button
            type="button"
            class="btn btn-sm btn-phoenix-secondary text-nowrap"
            aria-label="Bộ lọc"
            title="Bộ lọc"
            @click="openFilters"
          >
            <AppIcon name="filter" class="me-sm-2" />
            <span class="d-none d-sm-inline">Bộ lọc</span>
            <span
              v-if="activeFilterCount"
              class="badge text-bg-primary ms-2 d-none d-sm-inline"
            >
              {{ activeFilterCount }}
            </span>
          </button>
        </div>
      </template>
    </ListShell>

    <DrawerPanel
      :open="filterOpen"
      title="Lọc đơn hàng"
      @close="filterOpen = false"
    >
      <form class="d-flex flex-column gap-3" @submit.prevent="applyFilters">
        <div>
          <label class="form-label fw-bold mb-1" for="order-type-filter">
            Loại giao dịch
          </label>
          <select
            id="order-type-filter"
            v-model="draftType"
            class="form-select"
          >
            <option value="">Tất cả</option>
            <option value="1">Đơn bán</option>
            <option value="2">Đổi trả</option>
          </select>
        </div>
        <div>
          <label
            class="form-label fw-bold mb-1"
            for="customer-info-filter"
          >
            Thông tin khách
          </label>
          <select
            id="customer-info-filter"
            v-model="draftCustomerInfoStatus"
            class="form-select"
          >
            <option value="">Tất cả</option>
            <option value="complete">Đầy đủ</option>
            <option value="ocr_processing">OCR đang xử lý</option>
            <option value="review_required">Cần kiểm duyệt</option>
            <option value="manual_required">Cần nhập tay</option>
          </select>
        </div>
        <div>
          <label class="form-label fw-bold mb-1" for="order-status-filter">
            Trạng thái đơn hàng
          </label>
          <select
            id="order-status-filter"
            v-model="draftStatus"
            class="form-select"
          >
            <option value="">Tất cả</option>
            <option value="completed">Hoàn tất</option>
            <option value="returned">Đã đổi trả</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
        <div class="row g-2">
          <div class="col-12 col-sm-6">
            <label class="form-label fw-bold mb-1" for="order-from-filter">Từ ngày hoạt động</label>
            <input id="order-from-filter" v-model="draftFrom" type="date" class="form-control" />
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label fw-bold mb-1" for="order-to-filter">Đến ngày hoạt động</label>
            <input id="order-to-filter" v-model="draftTo" type="date" class="form-control" />
          </div>
        </div>
        <div v-if="filterError" class="alert alert-subtle-danger mb-0" role="alert">{{ filterError }}</div>
        <div class="d-flex gap-2 pt-2">
          <button type="submit" class="btn btn-primary flex-grow-1">
            Áp dụng
          </button>
          <button
            type="button"
            class="btn btn-phoenix-secondary"
            :disabled="!draftFilterCount"
            @click="clearFilters"
          >
            Xóa lọc
          </button>
        </div>
      </form>
    </DrawerPanel>

    <ConfirmDialog
      :open="Boolean(store.deleteTarget)"
      title="Hủy đơn hàng"
      :message="`Đơn của “${store.deleteTarget?.name || store.deleteTarget?.phone || 'khách lẻ'}” sẽ chuyển sang trạng thái đã hủy và vẫn được giữ trong lịch sử.`"
      confirm-label="Hủy đơn hàng"
      @cancel="store.cancelDelete"
      @confirm="store.confirmDelete"
    />

    <ConfirmDialog
      :open="Boolean(store.restoreTarget)"
      title="Khôi phục đơn hàng"
      :message="`Đơn của “${store.restoreTarget?.name || store.restoreTarget?.phone || 'khách lẻ'}” sẽ được khôi phục về trạng thái hoàn tất và sản phẩm sẽ được trừ lại vào tồn kho.`"
      confirm-label="Khôi phục"
      confirm-variant="success"
      @cancel="store.cancelRestore"
      @confirm="store.confirmRestore"
    />
  </div>
</template>

<script lang="ts">
import CheckoutRequests from "@/views/Orders/components/CheckoutRequests.vue";
import { defineComponent } from "vue";
import { searchQueryFromRoute } from "@/utils/global-search";
import ListShell from "@/components/ListLayout/ListShell.vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { orderDefinition } from "@/views/Orders/config";
import { useOrderStore } from "@/views/Orders/store";
import type {
  CustomerInfoStatus,
  Order,
  OrderStatus,
  OrderTypeFilter,
} from "@/views/Orders/types";
import { authenStore } from "@/stores/app-authen";
import type { ResourceDefinition, ResourceRow } from "@/config/resource";
import { inclusiveDateRangeError } from "@/utils/date-range";
import { routeQueryDate, routeQueryEnum } from "@/utils/route-query";

const orderStatuses: readonly OrderStatus[] = ["completed", "returned", "cancelled"];

export default defineComponent({
  name: "OrderListPage",
  components: { CheckoutRequests, AppIcon, ConfirmDialog, DrawerPanel, ListShell },
  data() {
    return {
      filterOpen: false,
      draftType: "" as OrderTypeFilter,
      draftStatus: "" as OrderStatus | "",
      draftCustomerInfoStatus: "" as CustomerInfoStatus | "",
      draftFrom: "",
      draftTo: "",
      filterError: "",
    };
  },
  computed: {
    store() { return useOrderStore(); },
    auth() { return authenStore(); },
    rows(): ResourceRow[] { return this.store.items as unknown as ResourceRow[]; },
    incompleteCount(): number { return this.store.counts.ocrProcessing + this.store.counts.reviewRequired + this.store.counts.manualRequired; },
    activeFilterCount(): number {
      return [this.store.type, this.store.status, this.store.customerInfoStatus]
        .filter(Boolean).length + (this.store.from || this.store.to ? 1 : 0);
    },
    draftFilterCount(): number {
      return [this.draftType, this.draftStatus, this.draftCustomerInfoStatus]
        .filter(Boolean).length + (this.draftFrom || this.draftTo ? 1 : 0);
    },
    effectiveDefinition(): ResourceDefinition {
      return {
        ...orderDefinition,
        columns: orderDefinition.columns.map((column) => ({
          ...column,
          visible: this.store.selectedColumns.includes(column.key),
        })),
        actions: {
          ...orderDefinition.actions,
          create: this.auth.can(orderDefinition.permission.create),
          delete: this.auth.can(orderDefinition.permission.delete),
          restore: this.auth.can(orderDefinition.permission.restore || orderDefinition.permission.delete),
        },
      };
    },
  },
  mounted() {
    this.store.query = searchQueryFromRoute(this.$route.query.query);
    const status = routeQueryEnum(this.$route.query.status, orderStatuses);
    const from = routeQueryDate(this.$route.query.from);
    const to = routeQueryDate(this.$route.query.to);
    const hasReportFilter = Boolean(this.$route.query.status || this.$route.query.from || this.$route.query.to);
    if (hasReportFilter) {
      this.store.type = "";
      this.store.customerInfoStatus = "";
    }
    this.store.status = status;
    this.store.from = "";
    this.store.to = "";
    if (!inclusiveDateRangeError(from, to)) {
      this.store.from = from;
      this.store.to = to;
    }
    void Promise.all([this.store.load(1), this.store.loadCounts()]);
  },
  methods: {
    async refreshCompletedOrders(): Promise<void> {
      await Promise.all([this.store.load(), this.store.loadCounts()]);
    },
    updateFields(fields: string[]): void { if (fields.length) this.store.selectedColumns = fields; },
    openDetail(row: ResourceRow): void { void this.$router.push(`/orders/${row.id}`); },
    canDeleteRow(row: ResourceRow): boolean { return ["draft", "completed"].includes(String(row.status)); },
    canRestoreRow(row: ResourceRow): boolean { return String(row.status) === "cancelled"; },
    requestDelete(row: ResourceRow): void { this.store.requestDelete(row as unknown as Order); },
    requestRestore(row: ResourceRow): void { this.store.requestRestore(row as unknown as Order); },
    openFilters(): void {
      this.draftType = this.store.type;
      this.draftStatus = this.store.status;
      this.draftCustomerInfoStatus = this.store.customerInfoStatus;
      this.draftFrom = this.store.from;
      this.draftTo = this.store.to;
      this.filterError = "";
      this.filterOpen = true;
    },
    resetDraftFilters(): void {
      this.draftType = "";
      this.draftStatus = "";
      this.draftCustomerInfoStatus = "";
      this.draftFrom = "";
      this.draftTo = "";
      this.filterError = "";
    },
    commitDraftFilters(): void {
      this.store.type = this.draftType;
      this.store.status = this.draftStatus;
      this.store.customerInfoStatus = this.draftCustomerInfoStatus;
      this.store.from = this.draftFrom;
      this.store.to = this.draftTo;
    },
    async applyFilters(): Promise<void> {
      this.filterError = inclusiveDateRangeError(this.draftFrom, this.draftTo);
      if (this.filterError) return;
      this.commitDraftFilters();
      await this.store.applyFilters();
      this.filterOpen = false;
    },
    async clearFilters(): Promise<void> {
      this.resetDraftFilters();
      this.commitDraftFilters();
      await this.store.applyFilters();
      this.filterOpen = false;
    },
  },
});
</script>
