import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import AppHeader from "@/components/app/Header.vue";

describe("AppHeader", () => {
  it("keeps the current-page search visible at mobile widths and emits trimmed input", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/dashboard", component: { template: "<div />" } },
        { path: "/products", component: { template: "<div />" } },
      ],
    });
    await router.push("/products");
    await router.isReady();

    const wrapper = mount(AppHeader, {
      props: {
        displayName: "Tester",
        profileOpen: false,
        searchable: true,
        theme: "light",
      },
      global: {
        plugins: [createPinia(), router],
        stubs: {
          AppAvatar: true,
          AppIcon: true,
          BrandLogo: true,
          ProfileMenu: true,
        },
      },
    });

    const search = wrapper.get(".navbar-top-search-box");
    expect(search.classes()).not.toContain("d-none");
    expect(search.classes()).not.toContain("d-lg-block");

    await wrapper.get('input[aria-label="Tìm kiếm nhanh"]').setValue("  NH-B925  ");
    await wrapper.get('form[role="search"]').trigger("submit");

    expect(wrapper.emitted("search")?.[0]).toEqual(["NH-B925"]);
  });
});
