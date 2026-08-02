import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Sidebar from "@/components/app/Sidebar.vue";
import { authenStore } from "@/stores/app-authen";

const StubPage = { template: "<div />" };
const sidebarPaths = [
  "/dashboard",
  "/orders",
  "/categories",
  "/materials",
  "/patterns",
  "/products",
  "/warehoused-goods",
  "/source-of-goods",
  "/customers",
  "/roles",
  "/users",
  "/settings",
];

async function mountSidebar(path = "/warehoused-goods", mobile = false) {
  setActivePinia(createPinia());
  const auth = authenStore();
  auth.user = { role: "ADMINISTRATOR", permissions: [] };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: sidebarPaths.map((routePath) => ({
      path: routePath,
      component: StubPage,
    })),
  });
  await router.push(path);
  await router.isReady();

  return mount(Sidebar, { props: { mobile }, global: { plugins: [router] } });
}

describe("AppSidebar", () => {
  it("renders Phoenix icon, text, and active-link anatomy", async () => {
    const wrapper = await mountSidebar();
    const warehouse = wrapper.get('a[href="/warehoused-goods"]');

    expect(warehouse.classes()).toEqual(
      expect.arrayContaining(["nav-link", "label-1", "active"]),
    );
    expect(warehouse.find(".nav-link-icon > svg.cms-icon").exists()).toBe(true);
    expect(
      warehouse.find(".nav-link-text-wrapper > .nav-link-text").text(),
    ).toBe("Hàng nhập kho");
  });

  it("renders the dedicated gem glyph for the Product menu", async () => {
    const wrapper = await mountSidebar("/products");
    const product = wrapper.get('a[href="/products"]');

    expect(product.get(".nav-link-text").text()).toBe("Sản phẩm");
    expect(product.get(".nav-link-icon svg path").attributes("d")).toBe(
      "M6 3h12l4 6-10 13L2 9Z",
    );
  });

  it("ports the Template2 root list, leaf-link attributes, and footer row", async () => {
    const wrapper = await mountSidebar();
    const warehouse = wrapper.get('a[href="/warehoused-goods"]');
    const footerToggle = wrapper.get('[data-testid="sidebar-toggle"]');

    expect(wrapper.get("#navbarVerticalNav").element.tagName).toBe("UL");
    expect(warehouse.attributes("role")).toBe("button");
    expect(warehouse.attributes("data-bs-toggle")).toBe("");
    expect(warehouse.attributes("aria-expanded")).toBe("false");
    expect(footerToggle.classes()).toEqual(
      expect.arrayContaining(["white-space-nowrap", "navbar-vertical-toggle"]),
    );
  });

  it("renders an active catalogue parent with the Template2 Phoenix hierarchy", async () => {
    const wrapper = await mountSidebar("/materials");
    const catalog = wrapper.find(
      'a[aria-controls="sidebar-submenu-commerce-catalog"]',
    );
    const submenu = wrapper.get("#sidebar-submenu-commerce-catalog");

    expect(catalog.exists()).toBe(true);
    expect(catalog.element.tagName).toBe("A");
    expect(catalog.attributes("href")).toBe(
      "#sidebar-submenu-commerce-catalog",
    );
    expect(catalog.attributes("role")).toBe("button");
    expect(catalog.attributes("data-bs-toggle")).toBe("collapse");
    expect(catalog.attributes("aria-expanded")).toBe("true");
    expect(catalog.classes()).toEqual(
      expect.arrayContaining([
        "nav-link",
        "dropdown-indicator",
        "label-1",
        "active",
      ]),
    );
    const caret = catalog.get(
      "div.dropdown-indicator-icon-wrapper > svg.svg-inline--fa.fa-caret-right.dropdown-indicator-icon",
    );

    expect(caret.attributes("viewBox")).toBe("0 0 256 512");
    expect(caret.attributes("data-prefix")).toBe("fas");
    expect(caret.attributes("data-icon")).toBe("caret-right");
    expect(caret.attributes("data-fa-i2svg")).toBe("");
    expect(caret.get("path").attributes("fill")).toBe("currentColor");
    expect(catalog.find(".nav-link-text-wrapper").exists()).toBe(false);
    expect(submenu.element.tagName).toBe("UL");
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    expect(submenu.classes()).toEqual(
      expect.arrayContaining(["nav", "collapse", "parent", "show"]),
    );
    expect(submenu.element.parentElement?.classList).toContain(
      "parent-wrapper",
    );
    expect(submenu.element.parentElement?.classList).toContain("label-1");
    expect(submenu.get(".collapsed-nav-item-title").text()).toBe("Danh mục");
    expect(submenu.get('a[href="/materials"] .nav-link-text').text()).toBe(
      "Chất liệu",
    );
    expect(wrapper.get('a[href="/materials"]').classes()).toContain("active");
  });

  it("keeps semantic parent controls on the same Phoenix row geometry as links", async () => {
    const wrapper = await mountSidebar("/materials");
    const nav = wrapper.get("nav.navbar-vertical");
    const collapse = wrapper.get(".navbar-collapse");
    const catalog = wrapper.get(
      'a[aria-controls="sidebar-submenu-commerce-catalog"]',
    );
    const submenu = wrapper.get("#sidebar-submenu-commerce-catalog");

    expect(nav.attributes("id")).toBe("navbarVertical");
    expect(collapse.attributes("id")).toBe("navbarVerticalCollapse");
    expect(catalog.classes()).not.toContain("w-100");
    expect(catalog.classes()).not.toContain("bg-transparent");
    expect(catalog.find(".cms-icon.dropdown-indicator-icon").exists()).toBe(
      false,
    );
    expect(submenu.attributes("data-bs-parent")).toBe(
      "#navbarVerticalCollapse",
    );
  });

  it("delegates parent expansion to the native Template2 collapse contract", async () => {
    const wrapper = await mountSidebar("/dashboard");
    const catalog = wrapper.find(
      'a[aria-controls="sidebar-submenu-commerce-catalog"]',
    );

    expect(catalog.exists()).toBe(true);
    expect(catalog.attributes("aria-expanded")).toBe("false");
    expect(catalog.classes()).not.toContain("collapsed");
    expect(catalog.attributes("data-bs-toggle")).toBe("collapse");
  });

  it("closes an active parent after navigating from its child to an independent menu", async () => {
    const wrapper = await mountSidebar("/materials");
    const catalogSubmenu = wrapper.get("#sidebar-submenu-commerce-catalog");

    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    expect(catalogSubmenu.classes()).toContain("show");

    await wrapper.get('a[href="/warehoused-goods"]').trigger("click");
    await new Promise<void>((resolve) => setTimeout(resolve, 10));

    expect(catalogSubmenu.classes()).not.toContain("show");
  });

  it("uses the same tree in the mobile context and closes after leaf navigation", async () => {
    const wrapper = await mountSidebar("/dashboard", true);
    const catalog = wrapper.find(
      'a[aria-controls="sidebar-submenu-commerce-catalog"]',
    );

    expect(
      wrapper.find("nav.navbar-vertical.position-static.w-100").exists(),
    ).toBe(true);
    expect(wrapper.get("nav.navbar-vertical").attributes("id")).toBe(
      "navbarVerticalMobile",
    );
    expect(wrapper.get(".navbar-collapse").attributes("id")).toBe(
      "navbarVerticalCollapseMobile",
    );
    expect(catalog.exists()).toBe(true);
    await catalog.trigger("click");
    expect(wrapper.emitted("close-mobile")).toBeUndefined();
    await wrapper.get('a[href="/categories"]').trigger("click");
    expect(wrapper.emitted("close-mobile")).toHaveLength(1);
  });

  it("shows Settings as the only system integration leaf", async () => {
    const wrapper = await mountSidebar("/settings");

    expect(wrapper.get('a[href="/settings"]').text()).toContain("Cài đặt");
    expect(wrapper.find('a[href="/zalo"]').exists()).toBe(false);
  });
});
