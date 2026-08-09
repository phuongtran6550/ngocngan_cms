<template>
  <section class="dashboard-page pb-5 mb-8">
    <PageHeader title="Tổng quan kinh doanh" :description="pageDescription">
      <template #actions>
        <button
          type="button"
          class="btn btn-phoenix-secondary"
          :disabled="store.loading"
          aria-label="Làm mới"
          title="Làm mới báo cáo"
          @click="refreshDashboard"
        >
          <AppIcon name="refresh" />
          <span class="d-none d-lg-inline ms-2">Làm mới</span>
        </button>
        <button
          v-if="auth.can(PERMISSIONS.exportOrders)"
          type="button"
          class="btn btn-primary"
          :disabled="exporting"
          title="Xuất đơn hàng trong kỳ"
          @click="exportOrders"
        >
          <span v-if="exporting" class="spinner-border spinner-border-sm" aria-hidden="true" />
          <AppIcon v-else name="download" />
          <span class="d-none d-lg-inline ms-2">{{ exporting ? "Đang xuất..." : "Xuất đơn hàng" }}</span>
        </button>
        <RouterLink
          v-if="auth.can(PERMISSIONS.warehouseView)"
          to="/print-devices"
          class="btn btn-primary"
          title="Tải và cài ứng dụng in"
          data-testid="download-print-bridge"
        >
          <AppIcon name="download" />
          <span class="d-none d-lg-inline ms-2">Tải ứng dụng in</span>
        </RouterLink>
      </template>
    </PageHeader>

    <DashboardPeriodFilter
      :query="store.query"
      :period-label="periodLabel"
      :last-updated-label="lastUpdatedLabel"
      :suggested-from="store.data?.period.from || ''"
      :suggested-to="store.data?.period.to || ''"
      @change="changePeriod"
    />

    <div v-if="message" class="alert alert-subtle-success" role="status">{{ message }}</div>
    <div v-if="store.error || exportError" class="alert alert-subtle-danger" role="alert">
      <span class="d-block">{{ exportError || store.error }}</span>
      <small v-if="store.error && store.data" class="d-block mt-1">
        Dữ liệu đang hiển thị là lần cập nhật thành công gần nhất.
      </small>
    </div>

    <LoadingSkeleton v-if="store.loading && !store.data" />

    <template v-else-if="store.data">
      <div v-if="store.loading" class="dashboard-refresh-state mb-3" role="status">
        <span class="spinner-border spinner-border-sm" aria-hidden="true" />
        <span>Đang cập nhật số liệu cho kỳ mới, dữ liệu gần nhất vẫn được giữ trên màn hình.</span>
      </div>

      <DashboardSummary :items="summaryCards" :comparison-label="comparisonLabel" />

      <div class="row g-4 mb-4">
        <div class="col-12 col-xl-8">
          <article class="card h-100 dashboard-section-card">
            <div class="card-header bg-transparent border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div>
                <p class="fs-10 fw-bold text-uppercase text-primary mb-1">Dòng tiền theo ngày</p>
                <h2 class="fs-7 mb-1">Bán hàng, đổi trả và doanh thu thuần</h2>
                <p class="text-body-tertiary fs-10 mb-0">Mỗi điểm dữ liệu dùng ngày hoạt động thực tế của đơn.</p>
              </div>
              <span class="badge badge-phoenix badge-phoenix-primary">{{ periodLabel }}</span>
            </div>
            <div class="card-body pt-2">
              <RevenueChart :series="store.data.dailySeries" :aria-label="`Biểu đồ doanh thu ${periodLabel}`" />
            </div>
          </article>
        </div>

        <div class="col-12 col-xl-4">
          <article class="card h-100 dashboard-section-card">
            <div class="card-header bg-transparent border-bottom">
              <p class="fs-10 fw-bold text-uppercase text-primary mb-1">Luồng giao dịch</p>
              <h2 class="fs-7 mb-1">Cơ cấu trạng thái đơn</h2>
              <p class="text-body-tertiary fs-10 mb-0">Chọn từng trạng thái để mở danh sách đã lọc.</p>
            </div>
            <div class="card-body">
              <component
                :is="item.to ? 'RouterLink' : 'div'"
                v-for="item in transactionMix"
                :key="item.status"
                v-bind="item.to ? { to: item.to } : {}"
                class="dashboard-mix-row d-block text-decoration-none mb-4"
                :class="{ 'dashboard-mix-row--linked': item.to }"
              >
                <div class="d-flex justify-content-between align-items-center gap-3 mb-2">
                  <span class="text-body fw-semibold">{{ item.label }}</span>
                  <span class="text-end">
                    <strong class="text-body">{{ number(item.value) }}</strong>
                    <small class="text-body-tertiary ms-1">({{ item.percent }}%)</small>
                  </span>
                </div>
                <div class="progress" style="height: 0.55rem">
                  <div class="progress-bar" :class="item.className" :style="{ width: `${item.percent}%` }" />
                </div>
              </component>
              <p class="text-body-tertiary fs-10 mb-0 pt-2 border-top border-translucent">
                Tỷ lệ đổi trả: <strong class="text-body">{{ percent(kpi("returnRate").value) }}</strong>
              </p>
            </div>
          </article>
        </div>
      </div>

      <section class="mb-4" aria-labelledby="dashboard-secondary-title">
        <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-2">
          <div>
            <p class="fs-10 fw-bold text-uppercase text-primary mb-1">Chỉ số chi tiết</p>
            <h2 id="dashboard-secondary-title" class="fs-7 mb-0">Hiệu suất bán hàng và sức khỏe tồn kho</h2>
          </div>
          <span class="text-body-tertiary fs-10">Chỉ số kho được ghi nhận tại thời điểm hiện tại</span>
        </div>
        <div class="row g-3">
          <div v-for="card in secondaryCards" :key="card.key" class="col-12 col-sm-6 col-xl-4">
            <KpiCard v-bind="card" />
          </div>
        </div>
      </section>

      <DashboardAlerts :alerts="store.data.alerts" :can-open="canOpenAlert" />

      <div class="row g-4 mb-4">
        <div class="col-12 col-lg-6">
          <DashboardRanking
            title="Khách hàng nổi bật"
            description="Xếp hạng theo doanh thu đơn hoàn tất trong kỳ"
            :items="customerRankingItems"
            value-format="money"
          />
        </div>
        <div class="col-12 col-lg-6">
          <DashboardRanking
            title="Nguồn hàng nổi bật"
            description="Giá trị hàng nhập được tạo trong kỳ"
            :items="sourceRankingItems"
            value-format="money"
          />
        </div>
      </div>

      <div class="row g-4">
        <div class="col-12 col-xl-5">
          <DashboardRanking
            title="Tồn kho giá trị cao"
            description="Giá vốn hiện tại tính theo từng SKU"
            :items="inventoryRankingItems"
            value-format="money"
          />
        </div>
        <div class="col-12 col-xl-7">
          <article class="card h-100 dashboard-section-card">
            <div class="card-header bg-transparent border-bottom d-flex align-items-end justify-content-between gap-3">
              <div>
                <p class="fs-10 fw-bold text-uppercase text-primary mb-1">Hoạt động mới nhất</p>
                <h2 class="fs-7 mb-1">Đơn hàng gần đây trong kỳ</h2>
                <p class="text-body-tertiary fs-10 mb-0">Sắp xếp theo thời điểm hoàn tất, đổi trả hoặc hủy.</p>
              </div>
              <RouterLink v-if="canOpenOrders" :to="orderListTarget() || '/orders'" class="fs-10 fw-semibold text-decoration-none text-nowrap">
                Xem tất cả
              </RouterLink>
            </div>
            <div class="card-body p-0">
              <div v-if="!store.data.recentOrders.length" class="p-4 text-center text-body-tertiary">
                Chưa có giao dịch trong kỳ báo cáo.
              </div>
              <component
                :is="canOpenOrders ? 'RouterLink' : 'div'"
                v-for="order in store.data.recentOrders"
                :key="order.id"
                v-bind="canOpenOrders ? { to: `/orders/${order.id}` } : {}"
                class="dashboard-order-row d-flex align-items-center gap-3 px-3 px-lg-4 py-3 border-bottom border-translucent text-decoration-none"
                :class="{ 'dashboard-order-row--linked': canOpenOrders }"
              >
                <span class="dashboard-order-row__status" :class="statusDotClass(order.status)" aria-hidden="true" />
                <span class="min-w-0 flex-grow-1">
                  <span class="d-flex flex-wrap align-items-center gap-2">
                    <strong class="text-body text-truncate">{{ order.name || "Khách lẻ" }}</strong>
                    <span class="badge badge-phoenix" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
                  </span>
                  <small class="text-body-tertiary d-block text-truncate">
                    {{ order.orderCode || order.phone || "Không có mã đơn" }} · {{ dateTime(order.activityAt || order.createdAt) }}
                  </small>
                </span>
                <strong class="text-body text-nowrap">{{ money(order.price) }}</strong>
              </component>
            </div>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { RouteLocationRaw } from "vue-router";
import PageHeader from "@/components/app/PageHeader.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import DashboardPeriodFilter from "@/views/Dashboard/components/DashboardPeriodFilter.vue";
import DashboardSummary from "@/views/Dashboard/components/DashboardSummary.vue";
import type { DashboardSummaryItem } from "@/views/Dashboard/components/DashboardSummary.vue";
import KpiCard from "@/views/Dashboard/components/KpiCard.vue";
import RevenueChart from "@/views/Dashboard/components/RevenueChart.vue";
import DashboardRanking from "@/views/Dashboard/components/DashboardRanking.vue";
import type { DashboardRankingItem } from "@/views/Dashboard/components/DashboardRanking.vue";
import DashboardAlerts from "@/views/Dashboard/components/DashboardAlerts.vue";
import { dashboardService } from "@/views/Dashboard/service";
import { useDashboardStore } from "@/views/Dashboard/store";
import {
  dashboardQueryFromRoute,
  dashboardQueryParams,
  formatDashboardDate,
  formatDashboardPeriod,
  sameDashboardQuery,
} from "@/views/Dashboard/period";
import type {
  DashboardAlert,
  DashboardMetric,
  DashboardQuery,
} from "@/views/Dashboard/types";
import { PERMISSIONS, type PermissionRequirement } from "@/config/permissions";
import { apiError } from "@/request";
import { authenStore } from "@/stores/app-authen";
import { browserDownload } from "@/utils/file-download";
import {
  formatDateTime,
  formatMoney,
  formatNumberValue,
  resourceStatusClass,
  resourceStatusLabel,
} from "@/utils/resource-display";

interface DashboardMetricCard extends DashboardSummaryItem {
  snapshot?: boolean;
}

const alertPermissions: Record<string, PermissionRequirement> = {
  "draft-orders": PERMISSIONS.ordersView,
  "low-stock": PERMISSIONS.warehouseView,
};

const fallbackMetric: DashboardMetric = {
  value: 0,
  previousValue: 0,
  changePercent: 0,
};

export default defineComponent({
  name: "DashboardPage",
  components: {
    AppIcon,
    DashboardAlerts,
    DashboardPeriodFilter,
    DashboardRanking,
    DashboardSummary,
    KpiCard,
    LoadingSkeleton,
    PageHeader,
    RevenueChart,
  },
  data() {
    return { exporting: false, exportError: "", message: "" };
  },
  computed: {
    PERMISSIONS() { return PERMISSIONS; },
    store() { return useDashboardStore(); },
    auth() { return authenStore(); },
    canOpenOrders(): boolean { return this.auth.can(PERMISSIONS.ordersView); },
    periodLabel(): string { return formatDashboardPeriod(this.store.data?.period); },
    pageDescription(): string { return `Tổng hợp bán hàng, khách hàng và tồn kho · ${this.periodLabel}`; },
    comparisonLabel(): string {
      const period = this.store.data?.period;
      if (!period?.previousFrom || !period.previousTo) return "So sánh với kỳ liền trước";
      const from = formatDashboardDate(period.previousFrom);
      const to = formatDashboardDate(period.previousTo);
      return `So với ${period.previousFrom === period.previousTo ? from : `${from} - ${to}`}`;
    },
    lastUpdatedLabel(): string {
      return this.store.lastUpdatedAt ? formatDateTime(this.store.lastUpdatedAt) : "";
    },
    summaryCards(): DashboardSummaryItem[] {
      return [
        {
          key: "netRevenue",
          label: "Doanh thu thuần",
          metric: this.kpi("netRevenue"),
          format: "money",
          tone: "green",
          icon: "pie-chart",
          to: this.orderListTarget(),
        },
        {
          key: "completedOrders",
          label: "Đơn hoàn tất",
          metric: this.kpi("completedOrders"),
          format: "number",
          tone: "blue",
          icon: "shopping-cart",
          to: this.orderListTarget("completed"),
        },
        {
          key: "returnValue",
          label: "Giá trị đổi trả",
          metric: this.kpi("returnValue"),
          format: "money",
          tone: "amber",
          icon: "history",
          to: this.orderListTarget("returned"),
          changeDirection: "lower",
        },
        {
          key: "newCustomers",
          label: "Khách hàng mới",
          metric: this.kpi("newCustomers"),
          format: "number",
          tone: "blue",
          icon: "users",
          to: this.newCustomerTarget,
        },
      ];
    },
    secondaryCards(): DashboardMetricCard[] {
      const warehouseTarget = this.auth.can(PERMISSIONS.warehouseView)
        ? { path: "/warehoused-goods" }
        : undefined;
      return [
        {
          key: "salesRevenue",
          label: "Doanh thu bán",
          metric: this.kpi("salesRevenue"),
          format: "money",
          tone: "blue",
          icon: "pie-chart",
          to: this.orderListTarget("completed"),
        },
        {
          key: "averageOrderValue",
          label: "Giá trị đơn trung bình",
          metric: this.kpi("averageOrderValue"),
          format: "money",
          tone: "green",
          icon: "shopping-cart",
          to: this.orderListTarget("completed"),
        },
        {
          key: "returnRate",
          label: "Tỷ lệ đổi trả",
          metric: this.kpi("returnRate"),
          format: "percent",
          tone: "red",
          icon: "history",
          to: this.orderListTarget("returned"),
          changeDirection: "lower",
        },
        {
          key: "inventoryCount",
          label: "Mặt hàng đang hoạt động",
          metric: this.kpi("inventoryCount"),
          format: "number",
          tone: "blue",
          icon: "archive",
          to: warehouseTarget,
          snapshot: true,
        },
        {
          key: "inventoryUnits",
          label: "Đơn vị tồn kho",
          metric: this.kpi("inventoryUnits"),
          format: "number",
          tone: "green",
          icon: "gem",
          to: warehouseTarget,
          snapshot: true,
        },
        {
          key: "inventoryValue",
          label: "Giá vốn tồn kho",
          metric: this.kpi("inventoryValue"),
          format: "money",
          tone: "amber",
          icon: "archive",
          to: warehouseTarget,
          snapshot: true,
        },
      ];
    },
    transactionMix(): Array<{
      status: "completed" | "returned" | "cancelled";
      label: string;
      value: number;
      percent: number;
      className: string;
      to?: RouteLocationRaw;
    }> {
      const mix = this.store.data?.transactionMix || { completed: 0, returned: 0, cancelled: 0 };
      const total = Math.max(mix.completed + mix.returned + mix.cancelled, 1);
      const items: Array<{
        status: "completed" | "returned" | "cancelled";
        label: string;
        value: number;
        className: string;
      }> = [
        { status: "completed", label: "Hoàn tất", value: mix.completed, className: "bg-success" },
        { status: "returned", label: "Đổi trả", value: mix.returned, className: "bg-warning" },
        { status: "cancelled", label: "Đã hủy", value: mix.cancelled, className: "bg-danger" },
      ];
      return items.map((item) => ({
        ...item,
        percent: Math.round((item.value / total) * 1000) / 10,
        to: this.orderListTarget(item.status),
      }));
    },
    newCustomerTarget(): RouteLocationRaw | undefined {
      if (!this.auth.can(PERMISSIONS.customersView)) return undefined;
      const query = this.periodRouteQuery();
      return query.from && query.to
        ? { path: "/customers", query: { ...query, customerCohort: "new" } }
        : { path: "/customers" };
    },
    customerRankingItems(): DashboardRankingItem[] {
      const canOpen = this.auth.can(PERMISSIONS.customersView);
      return (this.store.data?.topCustomers || []).map((item) => ({
        id: item.id,
        title: item.name || "Khách chưa đặt tên",
        subtitle: item.phone || "Không có số điện thoại",
        meta: `${formatNumberValue(item.orders)} đơn hoàn tất`,
        value: item.value,
        to: canOpen && item.phone
          ? { path: `/customers/${encodeURIComponent(item.phone)}` }
          : undefined,
      }));
    },
    sourceRankingItems(): DashboardRankingItem[] {
      const canOpen = this.auth.can(PERMISSIONS.sourceGoodsView);
      return (this.store.data?.topSources || []).map((item) => {
        const query = item.phone || item.name;
        return {
          id: item.id,
          title: item.name || "Nguồn hàng chưa đặt tên",
          subtitle: item.phone || "Không có số điện thoại",
          meta: `${formatNumberValue(item.items)} mặt hàng`,
          value: item.value,
          to: canOpen && query
            ? { path: "/source-of-goods", query: { query } }
            : undefined,
        };
      });
    },
    inventoryRankingItems(): DashboardRankingItem[] {
      const canOpen = this.auth.can(PERMISSIONS.warehouseView);
      return (this.store.data?.highValueInventory || []).map((item) => ({
        id: item.id,
        title: item.name || "Hàng chưa đặt tên",
        subtitle: item.code || "Chưa có mã hàng",
        meta: `${formatNumberValue(item.stock)} đơn vị tồn`,
        value: item.inventoryValue ?? item.importPrice,
        thumbnail: item.thumbnail,
        to: canOpen && item.id ? { path: `/warehoused-goods/${item.id}` } : undefined,
      }));
    },
  },
  watch: {
    "$route.query": {
      deep: true,
      handler(query: Record<string, unknown>): void {
        const nextQuery = dashboardQueryFromRoute(query);
        if (!sameDashboardQuery(nextQuery, this.store.query)) {
          void this.store.load(nextQuery);
        }
      },
    },
  },
  mounted() {
    void this.store.load(dashboardQueryFromRoute(this.$route.query));
  },
  methods: {
    kpi(key: string): DashboardMetric { return this.store.data?.kpis[key] || fallbackMetric; },
    money(value: number): string { return formatMoney(value); },
    number(value: number): string { return formatNumberValue(value); },
    percent(value: number): string { return `${formatNumberValue(value)}%`; },
    dateTime(value?: string): string { return value ? formatDateTime(value) : "—"; },
    statusLabel(status: string): string { return resourceStatusLabel(status); },
    statusClass(status: string): string { return resourceStatusClass(status); },
    statusDotClass(status: string): string {
      const classes: Record<string, string> = {
        completed: "bg-success",
        returned: "bg-warning",
        cancelled: "bg-danger",
      };
      return classes[status] || "bg-secondary";
    },
    periodRouteQuery(): Record<string, string> {
      const period = this.store.data?.period;
      return period?.from && period.to ? { from: period.from, to: period.to } : {};
    },
    orderListTarget(status?: "completed" | "returned" | "cancelled"): RouteLocationRaw | undefined {
      if (!this.auth.can(PERMISSIONS.ordersView)) return undefined;
      return {
        path: "/orders",
        query: {
          ...this.periodRouteQuery(),
          ...(status ? { status } : {}),
        },
      };
    },
    canOpenAlert(alert: DashboardAlert): boolean {
      const permission = alertPermissions[alert.key];
      return Boolean(permission && this.auth.can(permission));
    },
    async changePeriod(query: DashboardQuery): Promise<void> {
      this.message = "";
      this.exportError = "";
      if (sameDashboardQuery(query, this.store.query)) {
        await this.store.load(query);
        return;
      }
      await this.$router.replace({ path: "/dashboard", query: dashboardQueryParams(query) });
    },
    refreshDashboard(): void { void this.store.load(this.store.query); },
    async exportOrders(): Promise<void> {
      this.exporting = true;
      this.exportError = "";
      this.message = "";
      try {
        const result = await dashboardService.exportOrders(this.store.query);
        browserDownload(result.blob, result.filename);
        this.message = `Đã tạo tệp đơn hàng cho ${this.periodLabel}`;
      } catch (error) {
        this.exportError = apiError(error).message;
      } finally {
        this.exporting = false;
      }
    },
  },
});
</script>

<style scoped>
.dashboard-page { --dashboard-radius: 0.9rem; }
.dashboard-section-card { overflow: hidden; border-radius: var(--dashboard-radius); }

.dashboard-refresh-state {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--phoenix-primary) 20%, var(--phoenix-border-color));
  border-radius: 0.75rem;
  color: var(--phoenix-primary-text-emphasis);
  background: var(--phoenix-primary-bg-subtle);
  font-size: 0.8rem;
}

.dashboard-mix-row--linked { transition: transform 150ms ease; }
.dashboard-mix-row--linked:hover,
.dashboard-mix-row--linked:focus-visible { transform: translateX(0.25rem); }

.dashboard-order-row:last-child { border-bottom: 0 !important; }
.dashboard-order-row--linked { transition: background-color 150ms ease, padding-left 150ms ease; }
.dashboard-order-row--linked:hover,
.dashboard-order-row--linked:focus-visible { padding-left: 1.7rem !important; background: var(--phoenix-body-highlight-bg); }
.dashboard-order-row__status { flex: 0 0 auto; width: 0.65rem; height: 0.65rem; border-radius: 50%; }

@media (max-width: 575.98px) {
  .dashboard-order-row { align-items: flex-start !important; }
  .dashboard-order-row > strong { font-size: 0.78rem; }
}
</style>
