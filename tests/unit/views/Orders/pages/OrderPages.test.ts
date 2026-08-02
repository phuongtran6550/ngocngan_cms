import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { vi } from "vitest";
import OrderListPage from "@/views/Orders/index.vue";
import OrderCreatePage from "@/views/Orders/add.vue";
import OrderMissingPage from "@/views/Orders/missing.vue";
import OrderDetailPage from "@/views/Orders/detail.vue";
import { orderService } from "@/views/Orders/service";
import { useOrderStore } from "@/views/Orders/store";
import { authenStore } from "@/stores/app-authen";

const route = { query: {}, params: { id: "order-1" } };
const router = { push: vi.fn(), replace: vi.fn() };

function globalOptions() {
  return {
    mocks: { $route: route, $router: router },
    stubs: {
      RouterLink: { template: "<a><slot /></a>" },
      ListLayout: { template: '<section><slot name="filters" /></section>' },
      OrderForm: { template: "<form />" },
      DrawerPanel: { template: "<div><slot /></div>" },
      ConfirmDialog: true,
      ImagePreview: true,
      LoadingSkeleton: true,
      PaginationBar: true,
      ResourceImageCard: true,
      CustomerInfoStatusBadge: true,
      OrderCustomerReview: true,
    },
  };
}

describe("order pages", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    authenStore().user = { id: "admin-1", name: "Admin", role: "ADMINISTRATOR", permissions: [] };
    vi.spyOn(orderService, "options").mockResolvedValue({ categories: [] });
    vi.spyOn(orderService, "list").mockResolvedValue({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 });
    vi.spyOn(orderService, "missing").mockResolvedValue({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 });
    vi.spyOn(orderService, "detail").mockResolvedValue({
      id: "order-1",
      name: "Nguyễn An",
      phone: "0909000000",
      price: 2_500_000,
      thumbnail: "/uploads/order.jpg",
      images: ["/uploads/order.jpg"],
      status: "completed",
      sell: true,
      isRemoved: false,
      items: [],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the list and exposes the missing-info workflow", () => {
    const wrapper = mount(OrderListPage, { global: globalOptions() });
    expect(wrapper.text()).toContain("Đơn chờ bổ sung");
  });

  it("resets any previous draft when opening the create page", () => {
    const store = useOrderStore();
    store.draft = { id: "old-draft" } as never;
    mount(OrderCreatePage, { global: globalOptions() });
    expect(store.draft).toBeNull();
  });

  it("renders the missing page as a dedicated draft queue", () => {
    const wrapper = mount(OrderMissingPage, { global: globalOptions() });
    expect(wrapper.text()).toContain("Đơn chờ bổ sung");
  });

  it("loads the order detail from the route id", async () => {
    const wrapper = mount(OrderDetailPage, { global: globalOptions() });
    await vi.waitFor(() => expect(orderService.detail).toHaveBeenCalledWith("order-1"));
    expect(wrapper.exists()).toBe(true);
  });

  it("does not offer cancellation for a returned terminal order", async () => {
    vi.mocked(orderService.detail).mockResolvedValueOnce({
      id: "order-1",
      name: "Nguyễn An",
      phone: "0909000000",
      price: 2_500_000,
      thumbnail: "/uploads/order.jpg",
      images: ["/uploads/order.jpg"],
      status: "returned",
      sell: false,
      isRemoved: true,
      items: [],
    });

    const wrapper = mount(OrderDetailPage, { global: globalOptions() });
    await vi.waitFor(() => expect(wrapper.text()).toContain("Nguyễn An"));

    expect(wrapper.text()).not.toContain("Hủy đơn");
  });

  it("marks returned and cancelled rows as non-cancellable in the order list", () => {
    const wrapper = mount(OrderListPage, { global: globalOptions() });
    const page = wrapper.vm as unknown as { canDeleteRow: (row: { status: string }) => boolean };

    expect(page.canDeleteRow({ status: "draft" })).toBe(true);
    expect(page.canDeleteRow({ status: "completed" })).toBe(true);
    expect(page.canDeleteRow({ status: "returned" })).toBe(false);
    expect(page.canDeleteRow({ status: "cancelled" })).toBe(false);
  });

  it("shows category option failures required by detail editing", async () => {
    vi.mocked(orderService.options).mockRejectedValueOnce({
      message: "Không thể tải danh mục đơn hàng",
      code: "OPTIONS_UNAVAILABLE",
    });

    const wrapper = mount(OrderDetailPage, { global: globalOptions() });
    await vi.waitFor(() => expect(wrapper.text()).toContain("Nguyễn An"));

    expect(wrapper.find('[role="alert"]').text()).toContain("Không thể tải danh mục đơn hàng");
  });

  it("refreshes OCR processing rows in the background and stops after the state changes", async () => {
    vi.useFakeTimers();
    vi.mocked(orderService.missing)
      .mockResolvedValueOnce({
        items: [{
          id: "order-processing",
          orderCode: "DH-1",
          name: "",
          phone: "",
          price: 1_000_000,
          thumbnail: "/uploads/order.jpg",
          status: "completed",
          customerInfoStatus: "ocr_processing",
          items: [],
        } as never],
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        items: [{
          id: "order-processing",
          orderCode: "DH-1",
          name: "",
          phone: "",
          price: 1_000_000,
          thumbnail: "/uploads/order.jpg",
          status: "completed",
          customerInfoStatus: "review_required",
          items: [],
        } as never],
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
      });

    const wrapper = mount(OrderMissingPage, { global: globalOptions() });
    await vi.runOnlyPendingTimersAsync();

    expect(orderService.missing).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it("does not recreate the OCR polling timer after the page is unmounted", async () => {
    vi.useFakeTimers();
    let finishRefresh!: (value: Awaited<ReturnType<typeof orderService.missing>>) => void;
    vi.mocked(orderService.missing)
      .mockResolvedValueOnce({
        items: [{
          id: "order-processing",
          orderCode: "DH-1",
          name: "",
          phone: "",
          price: 1_000_000,
          thumbnail: "/uploads/order.jpg",
          status: "completed",
          customerInfoStatus: "ocr_processing",
          items: [],
        } as never],
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
      })
      .mockImplementationOnce(() => new Promise((resolve) => {
        finishRefresh = resolve;
      }));

    const wrapper = mount(OrderMissingPage, { global: globalOptions() });
    await Promise.resolve();
    await Promise.resolve();
    vi.advanceTimersByTime(8000);
    await Promise.resolve();
    expect(orderService.missing).toHaveBeenCalledTimes(2);

    wrapper.unmount();
    finishRefresh({ items: [], page: 1, limit: 12, total: 0, totalPages: 0 });
    await Promise.resolve();
    await Promise.resolve();
    vi.advanceTimersByTime(8000);

    expect(orderService.missing).toHaveBeenCalledTimes(2);
  });
});
