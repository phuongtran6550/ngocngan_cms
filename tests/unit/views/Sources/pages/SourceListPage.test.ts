import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import SourceListPage from "@/views/Sources/index.vue";
import { PERMISSIONS } from "@/config/permissions";
import { authenStore } from "@/stores/app-authen";
import { sourceService } from "@/views/Sources/service";

describe("SourceListPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(sourceService, "list").mockResolvedValue({
      items: [
        {
          id: "source-1",
          name: "Kim Hoàn Minh Anh",
          phone: "0909000000",
          itemCount: 2,
          totalImportValue: 5_000_000,
          price: 5_000_000,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("does not offer an inventory deep-link without warehouse.view", async () => {
    const auth = authenStore();
    auth.token = "token";
    auth.user = {
      role: "USER",
      permissions: [PERMISSIONS.sourceGoodsView],
    };

    const wrapper = mount(SourceListPage, {
      global: {
        mocks: {
          $route: { query: {} },
          $router: { push: vi.fn() },
        },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(wrapper.find('[aria-label="Xem Kim Hoàn Minh Anh"]').exists()).toBe(
      false,
    );
  });

  it("uses the trimmed route query before the first source request", async () => {
    mount(SourceListPage, {
      global: {
        mocks: {
          $route: { query: { query: "  0909 000 000  " } },
          $router: { push: vi.fn() },
        },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(sourceService.list).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        query: "0909 000 000",
      }),
      expect.any(AbortSignal),
    );
  });
});
