import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import ProfileMenu from "@/views/Account/components/ProfileMenu.vue";

const StubPage = { template: "<div />" };

const navigationEntries = [
  {
    key: "dashboard",
    label: "Tổng quan",
    path: "/dashboard",
    icon: "pie-chart",
  },
  { key: "orders", label: "Đơn hàng", path: "/orders", icon: "shopping-cart" },
  {
    key: "categories",
    label: "Danh mục",
    path: "/categories",
    icon: "grid",
  },
  {
    key: "warehouse",
    label: "Hàng nhập kho",
    path: "/warehoused-goods",
    icon: "archive",
  },
];

function mountMenu() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: StubPage },
      { path: "/profile", component: StubPage },
      { path: "/dashboard", component: StubPage },
      { path: "/orders", component: StubPage },
      { path: "/categories", component: StubPage },
      { path: "/warehoused-goods", component: StubPage },
      { path: "/profile/change-password", component: StubPage },
    ],
  });
  const wrapper = mount(ProfileMenu, {
    props: {
      open: true,
      displayName: "Ngọc Châu",
      avatar: "/uploads/profile-avatar.webp",
      navigationEntries,
    },
    global: { plugins: [router] },
  });
  return { wrapper, router };
}

describe("ProfileMenu", () => {
  it("keeps Phoenix's profile-dropdown anatomy while preserving CMS actions", async () => {
    const { wrapper } = mountMenu();

    const menu = wrapper.get('[data-testid="profile-menu"]');
    expect(menu.classes()).toEqual(
      expect.arrayContaining([
        "dropdown-menu",
        "dropdown-menu-end",
        "navbar-dropdown-caret",
        "dropdown-profile",
      ]),
    );
    expect(menu.get(".card-body > .text-center").text()).toContain("Ngọc Châu");
    expect(menu.find('[data-testid="profile-role"]').exists()).toBe(false);

    const avatar = menu.get(".avatar.avatar-xl");
    expect(avatar.get("img.rounded-circle").attributes("src")).toBe(
      "/uploads/profile-avatar.webp",
    );
    expect(avatar.find(".avatar-name").exists()).toBe(false);
    await avatar.get("img.rounded-circle").trigger("error");
    expect(avatar.find('[data-testid="default-avatar"]').exists()).toBe(true);
    expect(avatar.find("img.rounded-circle").exists()).toBe(false);

    const statusInput = menu.get('[data-testid="profile-status-input"]');
    expect(statusInput.attributes("placeholder")).toBe("Cập nhật trạng thái");
    await statusInput.setValue("Sẵn sàng hỗ trợ");
    expect((statusInput.element as HTMLInputElement).value).toBe(
      "Sẵn sàng hỗ trợ",
    );

    const menuBody = menu.get(".overflow-auto.scrollbar");
    expect(menuBody.attributes("style")).toContain("height: 10rem");
    expect(menu.findAll('[role="menuitem"]')).toHaveLength(7);
    expect(
      menu.get('[data-testid="profile-navigation-orders"]').attributes("href"),
    ).toBe("/orders");
    expect(menu.find('[data-testid="profile-warehouse-link"]').exists()).toBe(
      false,
    );
    expect(menu.get(".card-footer").classes()).toEqual(
      expect.arrayContaining(["p-0", "border-top", "border-translucent"]),
    );

    await wrapper
      .get('[data-testid="change-password-action"]')
      .trigger("click");
    expect(wrapper.emitted("change-password")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);

    await wrapper.get('[data-testid="logout-action"]').trigger("click");
    expect(wrapper.emitted("logout")).toHaveLength(1);
  });

  it("dismisses the Phoenix profile menu with Escape", async () => {
    const { wrapper } = mountMenu();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});
