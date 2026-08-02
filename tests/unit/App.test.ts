import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "@/App.vue";

describe("App", () => {
  it("renders the stable application root and router outlet", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
          component: { template: '<div data-testid="router-outlet" />' },
        },
      ],
    });
    await router.push("/");

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    });
    await router.isReady();

    expect(wrapper.find('[data-testid="app-root"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="router-outlet"]').exists()).toBe(true);
  });
});
