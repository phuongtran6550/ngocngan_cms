<template>
  <section class="pb-5 mb-8">
    <PageHeader
      title="Tổng quan kinh doanh"
      description="Tình hình đơn hàng, doanh thu và kho trong 30 ngày gần nhất."
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-phoenix-secondary"
          :disabled="store.loading"
          @click="store.load"
        >
          <AppIcon name="refresh" />
          <span class="ms-2">Làm mới</span>
        </button>
        <button
          v-if="auth.can('export.orders')"
          type="button"
          class="btn btn-primary"
          :disabled="exporting"
          @click="exportOrders"
        >
          <span
            v-if="exporting"
            class="spinner-border spinner-border-sm"
            aria-hidden="true"
          />
          <span :class="{ 'ms-2': exporting }">{{
            exporting ? "Đang xuất..." : "Xuất đơn hàng"
          }}</span>
        </button>
      </template>
    </PageHeader>

    <div v-if="message" class="alert alert-subtle-success" role="status">
      {{ message }}
    </div>
    <div
      v-if="store.error || exportError"
      class="alert alert-subtle-danger"
      role="alert"
    >
      {{ exportError || store.error }}
    </div>
    <LoadingSkeleton v-if="store.loading && !store.data" />

    <template v-else-if="store.data">
      <DashboardAlerts :alerts="store.data.alerts" :can-open="canOpenAlert" />

      <div class="row g-4 mb-4">
        <div class="col-12 col-xl-8">
          <article class="card h-100">
            <div
              class="card-header bg-transparent border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2"
            >
              <div>
                <h2 class="fs-7 mb-1">Doanh thu</h2>
                <p class="text-body-tertiary fs-10 mb-0">
                  Thanh toán theo tất cả giao dịch
                </p>
              </div>
              <span class="badge badge-phoenix badge-phoenix-primary"
                >30 ngày</span
              >
            </div>
            <div class="card-body pt-2">
              <RevenueChart :series="store.data.dailySeries" />
            </div>
          </article>
        </div>
        <div class="col-12 col-xl-4">
          <article class="card h-100">
            <div class="card-header bg-transparent border-bottom">
              <h2 class="fs-7 mb-1">Cơ cấu giao dịch</h2>
              <p class="text-body-tertiary fs-10 mb-0">
                Tỷ trọng theo trạng thái đơn hàng
              </p>
            </div>
            <div class="card-body">
              <div
                v-for="item in transactionMix"
                :key="item.label"
                class="mb-4"
              >
                <div class="d-flex justify-content-between mb-2">
                  <span>{{ item.label }}</span
                  ><strong>{{ item.value }}</strong>
                </div>
                <div class="progress" style="height: 0.5rem">
                  <div
                    class="progress-bar"
                    :class="item.className"
                    :style="{ width: `${item.percent}%` }"
                  />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div
          v-for="card in kpiCards"
          :key="card.key"
          class="col-12 col-sm-6 col-xl"
        >
          <KpiCard v-bind="card" />
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-12 col-lg-6">
          <DashboardRanking
            title="Khách hàng nổi bật"
            :items="store.data.topCustomers"
            value-key="value"
            meta-key="orders"
            value-format="money"
          />
        </div>
        <div class="col-12 col-lg-6">
          <DashboardRanking
            title="Nguồn hàng lớn"
            :items="store.data.topSources"
            value-key="value"
            meta-key="items"
            value-format="money"
          />
        </div>
      </div>

      <div class="row g-4">
        <div class="col-12 col-xl-5">
          <DashboardRanking
            title="Hàng nhập giá trị cao"
            :items="store.data.highValueInventory"
            value-key="importPrice"
            meta-key="stock"
            value-format="money"
          />
        </div>
        <div class="col-12 col-xl-7">
          <article class="card h-100">
            <div class="card-header bg-transparent border-bottom">
              <h2 class="fs-7 mb-1">Đơn gần đây</h2>
              <p class="text-body-tertiary fs-10 mb-0">
                Giao dịch vừa được cập nhật
              </p>
            </div>
            <div class="table-responsive">
              <table class="table table-sm fs-10 mb-0">
                <tbody>
                  <tr v-if="!store.data.recentOrders.length">
                    <td class="py-4 text-center text-body-tertiary" colspan="2">
                      Chưa có giao dịch.
                    </td>
                  </tr>
                  <tr v-for="order in store.data.recentOrders" :key="order.id">
                    <td class="ps-3 py-3">
                      <component
                        :is="canOpenOrders ? 'RouterLink' : 'span'"
                        class="text-decoration-none text-body"
                        v-bind="
                          canOpenOrders
                            ? { to: `/orders/${order.id}` }
                            : { 'aria-disabled': 'true' }
                        "
                      >
                        <strong class="d-block">{{
                          order.name || "Khách lẻ"
                        }}</strong>
                        <small class="text-body-tertiary">{{
                          order.phone || "—"
                        }}</small>
                      </component>
                    </td>
                    <td class="text-end pe-3 fw-semibold">
                      {{ money(order.price) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import KpiCard from "@/views/Dashboard/components/KpiCard.vue";
import RevenueChart from "@/views/Dashboard/components/RevenueChart.vue";
import DashboardRanking from "@/views/Dashboard/components/DashboardRanking.vue";
import DashboardAlerts from "@/views/Dashboard/components/DashboardAlerts.vue";
import { dashboardService } from "@/views/Dashboard/service";
import { useDashboardStore } from "@/views/Dashboard/store";
import type { DashboardMetric } from "@/views/Dashboard/types";
import type { DashboardAlert } from "@/views/Dashboard/components/DashboardAlerts.vue";
import { PERMISSIONS, type PermissionRequirement } from "@/config/permissions";
import { apiError } from "@/request";
import { authenStore } from "@/stores/app-authen";
import { formatMoney } from "@/utils/resource-display";

const alertPermissions: Record<string, PermissionRequirement> = {
  "/orders/missing": PERMISSIONS.ordersView,
  "/warehoused-goods": PERMISSIONS.warehouseView,
};

export default defineComponent({
  name: "DashboardPage",
  components: {
    AppIcon,
    DashboardAlerts,
    DashboardRanking,
    KpiCard,
    LoadingSkeleton,
    PageHeader,
    RevenueChart,
  },
  data() {
    return { exporting: false, exportError: "", message: "" };
  },
  computed: {
    store() {
      return useDashboardStore();
    },
    auth() {
      return authenStore();
    },
    canOpenOrders(): boolean {
      return this.auth.can(PERMISSIONS.ordersView);
    },
    kpiCards(): Array<{
      key: string;
      label: string;
      metric: DashboardMetric;
      format: "money" | "number";
      tone: "blue" | "green" | "amber" | "red";
    }> {
      const kpis = this.store.data?.kpis || {};
      const fallback = { value: 0, previousValue: 0, changePercent: 0 };
      return [
        {
          key: "sales",
          label: "Doanh thu bán",
          metric: kpis.salesRevenue || fallback,
          format: "money",
          tone: "blue",
        },
        {
          key: "net",
          label: "Thực thu",
          metric: kpis.netRevenue || fallback,
          format: "money",
          tone: "green",
        },
        {
          key: "returns",
          label: "Giá trị đổi trả",
          metric: kpis.returnValue || fallback,
          format: "money",
          tone: "amber",
        },
        {
          key: "today",
          label: "Đơn hôm nay",
          metric: kpis.todayOrders || fallback,
          format: "number",
          tone: "red",
        },
        {
          key: "customers",
          label: "Khách mới",
          metric: kpis.newCustomers || fallback,
          format: "number",
          tone: "blue",
        },
        {
          key: "inventory-count",
          label: "Sản phẩm kho",
          metric: kpis.inventoryCount || fallback,
          format: "number",
          tone: "green",
        },
        {
          key: "inventory-value",
          label: "Giá trị nhập kho",
          metric: kpis.inventoryValue || fallback,
          format: "money",
          tone: "amber",
        },
      ];
    },
    transactionMix(): Array<{
      label: string;
      value: number;
      percent: number;
      className: string;
    }> {
      const mix = this.store.data?.transactionMix || {
        completed: 0,
        returned: 0,
        cancelled: 0,
      };
      const total = Math.max(mix.completed + mix.returned + mix.cancelled, 1);
      return [
        {
          label: "Hoàn tất",
          value: mix.completed,
          percent: (mix.completed / total) * 100,
          className: "bg-success",
        },
        {
          label: "Đổi trả",
          value: mix.returned,
          percent: (mix.returned / total) * 100,
          className: "bg-warning",
        },
        {
          label: "Đã hủy",
          value: mix.cancelled,
          percent: (mix.cancelled / total) * 100,
          className: "bg-danger",
        },
      ];
    },
  },
  mounted() {
    void this.store.load();
  },
  methods: {
    money(value: number): string {
      return formatMoney(value);
    },
    canOpenAlert(alert: DashboardAlert): boolean {
      return this.auth.can(alertPermissions[alert.path]);
    },
    async exportOrders(): Promise<void> {
      this.exporting = true;
      this.exportError = "";
      this.message = "";
      try {
        const result = await dashboardService.exportOrders();
        const url = URL.createObjectURL(result.blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = result.filename;
        anchor.click();
        URL.revokeObjectURL(url);
        this.message = "Đã tạo tệp xuất đơn hàng";
      } catch (error) {
        this.exportError = apiError(error).message;
      } finally {
        this.exporting = false;
      }
    },
  },
});
</script>
