import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { dashboardService } from "@/views/Dashboard/service";
import { useDashboardStore } from "@/views/Dashboard/store";
import DashboardPage from "@/views/Dashboard/index.vue";
import { PERMISSIONS } from "@/config/permissions";
import { authenStore } from "@/stores/app-authen";

const overview = {
  period: { timezone: "Asia/Ho_Chi_Minh" },
  kpis: {},
  dailySeries: [],
  transactionMix: { completed: 0, returned: 0, cancelled: 0 },
  alerts: [
    {
      key: "draft-orders",
      title: "Đơn chờ bổ sung",
      value: 4,
      path: "/orders/missing",
    },
    {
      key: "low-stock",
      title: "Sản phẩm sắp hết",
      value: 3,
      path: "/warehoused-goods",
    },
  ],
  topCustomers: [],
  topSources: [],
  highValueInventory: [],
  recentOrders: [],
};

describe("DashboardPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    authenStore().user = { role: "ADMINISTRATOR", permissions: [] };
    vi.spyOn(dashboardService, "overview").mockResolvedValue(overview);
    useDashboardStore().data = overview;
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders actionable dashboard alerts with their counts and destinations", () => {
    const wrapper = mount(DashboardPage, {
      global: {
        stubs: {
          DashboardRanking: true,
          KpiCard: true,
          LoadingSkeleton: true,
          RevenueChart: true,
          RouterLink: {
            props: ["to"],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Đơn chờ bổ sung");
    expect(wrapper.text()).toContain("Sản phẩm sắp hết");
    expect(wrapper.find("section.mb-8").exists()).toBe(true);
    expect(
      wrapper.find(".card.h-100 > .card-header.border-bottom").exists(),
    ).toBe(true);
    expect(wrapper.find(".cms-dashboard-primary-card").exists()).toBe(false);
    expect(wrapper.find('a[href="/orders/missing"]').text()).toContain("4");
    expect(wrapper.find('a[href="/warehoused-goods"]').text()).toContain("3");
  });

  it("keeps dashboard data visible without linking to unauthorized modules", () => {
    authenStore().user = {
      role: "USER",
      permissions: [PERMISSIONS.dashboardView],
    };
    useDashboardStore().data = {
      ...overview,
      recentOrders: [
        {
          id: "order-1",
          name: "Nguyễn An",
          phone: "0909000000",
          price: 2_500_000,
          status: "completed",
        },
      ],
    };

    const wrapper = mount(DashboardPage, {
      global: {
        stubs: {
          DashboardRanking: true,
          KpiCard: true,
          LoadingSkeleton: true,
          RevenueChart: true,
          RouterLink: {
            props: ["to"],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Đơn chờ bổ sung");
    expect(wrapper.text()).toContain("Nguyễn An");
    expect(wrapper.find('a[href="/orders/missing"]').exists()).toBe(false);
    expect(wrapper.find('a[href="/warehoused-goods"]').exists()).toBe(false);
    expect(wrapper.find('a[href="/orders/order-1"]').exists()).toBe(false);
  });
});
