import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import CategoryListPage from "@/views/Categories/index.vue";
import { request } from "@/request";
import { authenStore } from "@/stores/app-authen";

describe("CategoryListPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    vi.spyOn(request, "request").mockResolvedValue({
      status: 200,
      data: {
        items: [
          {
            id: "category-1",
            name: "Nhẫn",
            description: "Nhóm nhẫn",
            productCount: 3,
            createdBy: {
              id: "user-1",
              name: "Ngọc Châu",
              username: "ngocchau-admin",
            },
          },
          {
            id: "category-2",
            name: "Vòng tay",
            description: "",
            productCount: 0,
            createdBy: { id: "user-2", name: "Quản trị viên" },
          },
        ],
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
      headers: {},
    } as never);
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders the dedicated Danh mục page and populated resource list", async () => {
    const wrapper = mount(CategoryListPage, {
      global: {
        mocks: { $route: { query: {} } },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Quản lý danh mục");
    expect(wrapper.text()).toContain("Nhẫn");
    expect(wrapper.text()).toContain("Ngọc Châu");
    expect(wrapper.text()).not.toContain("ngocchau-admin");
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Xóa Nhẫn"]').exists()).toBe(false);
    const desktopTable = wrapper.get('[data-testid="desktop-data-table"]');
    expect(desktopTable.text()).not.toContain("Nhóm nhẫn");
    expect(desktopTable.get("tbody tr:first-child td:nth-child(2)").text()).toBe(
      "3",
    );
    expect(desktopTable.findAll('[data-testid="default-avatar"]')).toHaveLength(
      2,
    );
    expect(
      desktopTable.findAll('[data-testid="row-action-menu"]'),
    ).toHaveLength(2);
  });

  it("opens the create drawer for the fixed Danh mục resource", async () => {
    const wrapper = mount(CategoryListPage, {
      global: {
        mocks: { $route: { query: {} } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    await wrapper.get('[data-testid="list-create"]').trigger("click");

    expect(document.body.textContent).toContain("Thêm danh mục");
    expect(document.body.querySelector('input[name="name"]')).not.toBeNull();
    expect(
      document.body.querySelector('textarea[name="description"]'),
    ).not.toBeNull();
    expect(document.body.querySelector('select[name="status"]')).toBeNull();
    expect(document.body.querySelector('input[name="sortOrder"]')).toBeNull();
    wrapper.unmount();
  });

  it("uses the trimmed route query before the first category request", async () => {
    mount(CategoryListPage, {
      global: {
        mocks: { $route: { query: { query: "  nhẫn cưới  " } } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(request.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
        url: "/categories",
        params: expect.objectContaining({ page: 1, query: "nhẫn cưới" }),
      }),
    );
    expect(request.request).not.toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ status: expect.anything() }),
      }),
    );
  });
});
