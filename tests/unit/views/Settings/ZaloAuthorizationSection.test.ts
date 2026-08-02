import { flushPromises, mount } from "@vue/test-utils";
import { vi } from "vitest";
import { zaloService } from "@/views/Zalo/service";
import ZaloAuthorizationSection from "@/views/Settings/components/ZaloAuthorizationSection.vue";

describe("ZaloAuthorizationSection", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders connected OA details without exposing token secrets", async () => {
    vi.spyOn(zaloService, "status").mockResolvedValue({
      configured: true,
      connected: true,
      state: "connected",
      oa: { id: "oa-1", name: "Ngọc Châu OA", avatar: "" },
      connectedAt: "2026-07-27T00:00:00.000Z",
      connectedBy: "user-1",
      accessExpiresAt: "2026-07-27T01:00:00.000Z",
      refreshExpiresAt: "2026-07-28T00:00:00.000Z",
      lastRefreshedAt: "2026-07-27T00:30:00.000Z",
      pendingStateExpiresAt: null,
      reconnectRequired: false,
      retryAfterSeconds: 0,
    });

    const wrapper = mount(ZaloAuthorizationSection);
    await flushPromises();

    expect(wrapper.text()).toContain("Ngọc Châu OA");
    expect(wrapper.text()).toContain("Đã kết nối");
    expect(wrapper.text()).not.toContain("access-secret");
    expect(wrapper.text()).not.toContain("refresh-secret");
  });
});
