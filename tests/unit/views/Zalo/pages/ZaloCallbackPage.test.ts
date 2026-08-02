import { flushPromises, mount } from "@vue/test-utils";
import { vi } from "vitest";
import { zaloService } from "@/views/Zalo/service";
import ZaloCallbackPage from "@/views/Zalo/callback.vue";

describe("ZaloCallbackPage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts the callback payload and shows success for a connected OA", async () => {
    vi.spyOn(zaloService, "callback").mockResolvedValue({
      configured: true,
      connected: true,
      state: "connected",
      oa: { id: "oa-1", name: "Ngọc Châu OA", avatar: "" },
      connectedAt: "2026-07-27T00:00:00.000Z",
      connectedBy: "user-1",
      accessExpiresAt: "2026-07-27T01:00:00.000Z",
      refreshExpiresAt: "2026-07-28T00:00:00.000Z",
      lastRefreshedAt: "2026-07-27T00:30:00.000Z",
      reconnectRequired: false,
      retryAfterSeconds: 0,
    });

    const wrapper = mount(ZaloCallbackPage, {
      global: {
        stubs: { RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" } },
        mocks: {
          $route: { query: { code: "oauth-code", state: "oauth-state" } },
          $router: { replace: vi.fn() },
        },
      },
    });

    await flushPromises();

    expect(zaloService.callback).toHaveBeenCalledWith({ code: "oauth-code", state: "oauth-state" });
    expect(wrapper.text()).toContain("Ngọc Châu OA");
    expect(wrapper.text()).toContain("Đã kết nối");
    expect(wrapper.get('a[href="/settings#zalo"]').text()).toContain("Quay lại Cài đặt");
  });
});
