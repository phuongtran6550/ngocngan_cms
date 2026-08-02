import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory, RouterView } from "vue-router";
import App from "@/App.vue";
import { authenStore } from "@/stores/app-authen";

afterEach(() => {
  document.body.innerHTML = "";
  window.localStorage.clear();
});

const StubPage = { template: "<div />" };

function mountApp() {
  window.localStorage.clear();
  setActivePinia(createPinia());
  const auth = authenStore();
  auth.token = "token";
  auth.user = {
    name: "Ngọc Châu",
    username: "admin",
    avatar: "/uploads/admin-avatar.webp",
    role: "USER",
    permissions: ["categories.view"],
  };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: RouterView },
      { path: "/login", component: StubPage },
      { path: "/dashboard", component: StubPage },
      { path: "/categories", component: StubPage },
      { path: "/patterns", component: StubPage },
      { path: "/profile", component: StubPage },
      { path: "/profile/change-password", component: StubPage },
    ],
  });

  return mount(App, {
    global: { plugins: [router] },
  });
}

describe("App composition", () => {
  it("renders the Phoenix vertical-nav, top-nav, and content sibling contract", () => {
    const wrapper = mountApp();

    expect(
      wrapper
        .find("nav.navbar-vertical + nav.navbar.navbar-top ~ div.content")
        .exists(),
    ).toBe(true);
    expect(
      wrapper.find("div.content > footer.footer.position-absolute").exists(),
    ).toBe(true);
    expect(
      wrapper
        .find(
          '[data-testid="mobile-nav-toggle"] > .navbar-toggle-icon > .toggle-line',
        )
        .exists(),
    ).toBe(true);
  });

  it("toggles the collapsed sidebar state", async () => {
    const wrapper = mountApp();

    await wrapper.get('[data-testid="sidebar-toggle"]').trigger("click");

    expect(
      wrapper.find('[data-testid="app-shell"].is-sidebar-collapsed').exists(),
    ).toBe(true);
  });

  it("opens the profile menu and emits a logout action", async () => {
    const wrapper = mountApp();

    const triggerAvatar = wrapper.get(
      '[data-testid="profile-trigger"] .avatar',
    );
    expect(triggerAvatar.classes()).toEqual(
      expect.arrayContaining(["avatar", "avatar-l"]),
    );
    expect(triggerAvatar.get("img.rounded-circle").attributes("src")).toBe(
      "/uploads/admin-avatar.webp",
    );
    expect(triggerAvatar.find(".avatar-name").exists()).toBe(false);
    await triggerAvatar.get("img.rounded-circle").trigger("error");
    expect(triggerAvatar.find('[data-testid="default-avatar"]').exists()).toBe(
      true,
    );
    expect(triggerAvatar.find("img.rounded-circle").exists()).toBe(false);

    await wrapper.get('[data-testid="profile-trigger"]').trigger("click");
    expect(wrapper.find('[data-testid="profile-menu"]').isVisible()).toBe(true);

    const profileAvatar = wrapper.get(
      '[data-testid="profile-menu"] .avatar.avatar-xl',
    );
    expect(profileAvatar.get("img.rounded-circle").attributes("src")).toBe(
      "/uploads/admin-avatar.webp",
    );
    expect(profileAvatar.find(".avatar-name").exists()).toBe(false);

    await wrapper.get('[data-testid="logout-action"]').trigger("click");
    expect(authenStore().token).toBe("");
  });

  it("opens the change password drawer from the profile menu", async () => {
    const wrapper = mountApp();

    await wrapper.get('[data-testid="profile-trigger"]').trigger("click");
    await wrapper
      .get('[data-testid="change-password-action"]')
      .trigger("click");
    await nextTick();

    expect(wrapper.find('[data-testid="profile-menu"]').exists()).toBe(false);
    expect(
      document.body.querySelector('[role="dialog"][aria-label="Đổi mật khẩu"]'),
    ).not.toBeNull();
  });

  it("toggles the Phoenix theme without route reload", async () => {
    const wrapper = mountApp();

    await wrapper.get('[data-testid="theme-toggle"]').trigger("click");

    expect(document.documentElement.dataset.bsTheme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("ngocchau.theme")).toBe("dark");
  });

  it("opens and closes the mobile navigation drawer", async () => {
    const wrapper = mountApp();

    await wrapper.get('[data-testid="mobile-nav-toggle"]').trigger("click");
    expect(
      document.body.querySelector('[data-testid="mobile-nav-drawer"]'),
    ).not.toBeNull();

    document.body
      .querySelector<HTMLButtonElement>('[data-testid="mobile-nav-close"]')
      ?.click();
    await nextTick();
    expect(
      document.body.querySelector('[data-testid="mobile-nav-drawer"]'),
    ).toBeNull();
  });

  it("routes global search within the current searchable module", async () => {
    const wrapper = mountApp();
    await wrapper.vm.$router.push("/categories");
    await flushPromises();

    await wrapper.get('[role="search"] input').setValue("  nhẫn cưới  ");
    await wrapper.get('[role="search"]').trigger("submit");
    await flushPromises();

    expect(wrapper.vm.$router.currentRoute.value.fullPath).toBe(
      "/categories?query=nh%E1%BA%ABn+c%C6%B0%E1%BB%9Bi",
    );
  });
});
