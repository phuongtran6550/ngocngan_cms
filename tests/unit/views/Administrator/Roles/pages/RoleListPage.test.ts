import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { roleService } from "@/views/Administrator/Roles/service";
import RoleListPage from "@/views/Administrator/Roles/index.vue";
import { authenStore } from "@/stores/app-authen";

describe("RoleListPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    vi.spyOn(roleService, "list").mockResolvedValue({
      items: [
        {
          id: "system",
          name: "Quản trị viên",
          description: "",
          permissions: [],
          systemRole: "ADMINISTRATOR",
          isSystem: true,
          assignedUserCount: 1,
        },
        {
          id: "custom",
          name: "Bán hàng",
          description: "",
          permissions: ["orders.view"],
          systemRole: "USER",
          isSystem: false,
          assignedUserCount: 2,
        },
        {
          id: "unused",
          name: "Kho dự phòng",
          description: "",
          permissions: ["warehouse.view"],
          systemRole: "USER",
          isSystem: false,
          assignedUserCount: 0,
        },
      ],
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1,
    });
    vi.spyOn(roleService, "permissions").mockResolvedValue({
      items: [],
      groups: [],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders roles and hides invalid actions for system roles", async () => {
    const wrapper = mount(RoleListPage, {
      global: {
        mocks: { $route: { query: {} } },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Quản trị viên");
    expect(wrapper.text()).toContain("Bán hàng");
    expect(wrapper.find('[aria-label="Xóa Quản trị viên"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[aria-label="Xóa Bán hàng"]').exists()).toBe(false);
    await wrapper
      .get('[aria-label="Thao tác với Kho dự phòng"]')
      .trigger("click");
    expect(wrapper.find('[aria-label="Xóa Kho dự phòng"]').exists()).toBe(true);
  });

  it("uses the trimmed route query before the first role request", async () => {
    mount(RoleListPage, {
      global: {
        mocks: { $route: { query: { query: "  bán hàng  " } } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(roleService.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, query: "bán hàng" }),
      expect.any(AbortSignal),
    );
  });
});
