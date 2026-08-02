import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import LoginPage from "@/views/Account/login.vue";
import { PERMISSIONS } from "@/config/permissions";
import { authenStore } from "@/stores/app-authen";

function mountLogin(
  query: Record<string, unknown> = {},
  replace = vi.fn(),
) {
  return mount(LoginPage, {
    global: {
      mocks: {
        $route: { query },
        $router: { replace },
      },
      stubs: { RouterLink: { template: "<a><slot /></a>" } },
    },
  });
}

describe("LoginPage", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.restoreAllMocks());

  it("renders the Phoenix form-icon structure for login credentials", () => {
    const wrapper = mountLogin();

    expect(wrapper.get("#username").classes()).toContain("form-icon-input");
    expect(wrapper.get("#password").classes()).toContain("form-icon-input");
    expect(wrapper.get('[data-testid="login-username-icon"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="login-password-icon"]').exists()).toBe(true);
  });

  it("uses the Phoenix solid glyphs for credential icons", () => {
    const wrapper = mountLogin();

    const usernameIcon = wrapper.get('[data-testid="login-username-icon"]');
    const passwordIcon = wrapper.get('[data-testid="login-password-icon"]');

    expect(usernameIcon.attributes("viewBox")).toBe("0 0 448 512");
    expect(passwordIcon.attributes("viewBox")).toBe("0 0 512 512");
    expect(usernameIcon.get("path").attributes("fill")).toBe("currentColor");
    expect(passwordIcon.get("path").attributes("fill")).toBe("currentColor");
  });

  it("reveals and conceals the password from the Phoenix visibility control", async () => {
    const wrapper = mountLogin();

    const password = wrapper.get("#password");
    const toggle = wrapper.get('[data-testid="password-visibility-toggle"]');

    expect(password.attributes("type")).toBe("password");
    expect(toggle.attributes("aria-pressed")).toBe("false");

    await toggle.trigger("click");

    expect(password.attributes("type")).toBe("text");
    expect(toggle.attributes("aria-pressed")).toBe("true");

    await toggle.trigger("click");

    expect(password.attributes("type")).toBe("password");
    expect(toggle.attributes("aria-pressed")).toBe("false");
  });

  it("rejects external redirect targets after login", async () => {
    const auth = authenStore();
    const user = {
      role: "USER",
      permissions: [PERMISSIONS.categoriesView],
    };
    vi.spyOn(auth, "login").mockImplementation(async () => {
      auth.user = user;
      auth.token = "token";
      return user;
    });
    const replace = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountLogin({ redirect: "//evil.example/steal" }, replace);

    await wrapper.get("#username").setValue("admin");
    await wrapper.get("#password").setValue("secret1");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(replace).toHaveBeenCalledWith("/categories");
  });
});
