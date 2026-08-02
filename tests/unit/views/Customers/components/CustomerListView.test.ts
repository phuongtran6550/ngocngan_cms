import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import CustomerListView from "@/views/Customers/components/CustomerListView.vue";
import { customerService } from "@/views/Customers/service";
import { PERMISSIONS } from "@/config/permissions";
import { authenStore } from "@/stores/app-authen";

describe("CustomerListView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(customerService, "list").mockResolvedValue({
      items: [{
        id: "customer-1",
        name: "Nguyễn An",
        phone: "0909000000",
        price: 2_500_000,
        priceReturn: 0,
        orderCount: 1,
        completedOrderCount: 1,
        returnedOrderCount: 0,
      }],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("does not offer an order deep-link without orders.view", async () => {
    const auth = authenStore();
    auth.token = "token";
    auth.user = {
      role: "USER",
      permissions: [PERMISSIONS.customersView],
    };

    const wrapper = mount(CustomerListView, {
      props: { mode: "current" },
      global: {
        mocks: {
          $route: { query: {} },
          $router: { push: vi.fn() },
        },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(wrapper.find('[aria-label="Xem Nguyễn An"]').exists()).toBe(false);
  });
});
