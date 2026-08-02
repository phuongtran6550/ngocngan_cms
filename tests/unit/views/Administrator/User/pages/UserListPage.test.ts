import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { roleService } from "@/views/Administrator/Roles/service";
import { userService } from "@/views/Administrator/User/service";
import UserListPage from "@/views/Administrator/User/index.vue";
import { authenStore } from "@/stores/app-authen";

describe("UserListPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { id: "user-self", role: "ADMINISTRATOR", permissions: [] };
    vi.spyOn(userService, "list").mockResolvedValue({
      items: [
        {
          id: "user-self",
          name: "Nguyễn An",
          username: "an",
          role: "ADMINISTRATOR",
          roleId: "",
          assignedRole: null,
          permissions: ["users.manage"],
        },
        {
          id: "user-2",
          name: "Lê Bình",
          username: "binh",
          role: "USER",
          roleId: "role-1",
          assignedRole: {
            id: "role-1",
            name: "Bán hàng",
            description: "",
            permissions: ["orders.view"],
          },
          permissions: ["orders.view"],
        },
      ],
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
    vi.spyOn(roleService, "options").mockResolvedValue([
      { id: "role-1", name: "Bán hàng" },
    ] as never);
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders users and hides self-delete actions", async () => {
    const wrapper = mount(UserListPage, {
      global: {
        mocks: { $route: { query: {} } },
        stubs: { RouterLink: true, Teleport: true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Nguyễn An");
    expect(wrapper.text()).toContain("Lê Bình");
    expect(wrapper.text()).toContain("Bán hàng");
    expect(wrapper.find('[aria-label="Xóa Nguyễn An"]').exists()).toBe(false);
    await wrapper.get('[aria-label="Thao tác với Lê Bình"]').trigger("click");
    expect(wrapper.find('[aria-label="Xóa Lê Bình"]').exists()).toBe(true);
  });

  it("uses the trimmed route query before the first user request", async () => {
    mount(UserListPage, {
      global: {
        mocks: { $route: { query: { query: "  nguyễn an  " } } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(userService.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, query: "nguyễn an" }),
      expect.any(AbortSignal),
    );
  });
});
