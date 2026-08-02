import { vi } from "vitest";
import { request } from "@/request";
import { zaloService } from "@/views/Zalo/service";

describe("zalo service", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the shared request client for status and auth url", async () => {
    const get = vi.spyOn(request, "get")
      .mockResolvedValueOnce({ data: { state: "disconnected" } } as never)
      .mockResolvedValueOnce({ data: { url: "https://oauth.zaloapp.com/connect" } } as never);

    await zaloService.status();
    await zaloService.authUrl();

    expect(get).toHaveBeenNthCalledWith(1, "/zalo/status", { signal: undefined });
    expect(get).toHaveBeenNthCalledWith(2, "/zalo/auth-url", { signal: undefined });
  });

  it("posts callback payloads and disconnects through the Zalo API", async () => {
    const post = vi.spyOn(request, "post").mockResolvedValue({ data: { state: "connected" } } as never);
    const remove = vi.spyOn(request, "delete").mockResolvedValue({} as never);

    await zaloService.callback({ code: "code", state: "state" });
    await zaloService.disconnect();

    expect(post).toHaveBeenCalledWith("/zalo/callback", { code: "code", state: "state" });
    expect(remove).toHaveBeenCalledWith("/zalo/disconnect");
  });
});
