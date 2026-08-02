import { vi } from "vitest";
import { request } from "@/request";
import { userService } from "@/views/Administrator/User/service";

describe("user service", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the shared request client for list filters", async () => {
    const get = vi.spyOn(request, "get").mockResolvedValue({
      data: { items: [], page: 1, limit: 20, total: 0, totalPages: 0 },
    } as never);

    await userService.list({ page: 1, limit: 20, query: "an", role: "USER", sortBy: "username" });

    expect(get).toHaveBeenCalledWith("/users", {
      params: { page: 1, limit: 20, query: "an", role: "USER", sortBy: "username" },
      signal: undefined,
    });
  });

  it("loads the grouped permission catalog from the users compatibility API", async () => {
    const get = vi.spyOn(request, "get").mockResolvedValue({ data: { items: [], groups: [] } } as never);

    await userService.permissions();

    expect(get).toHaveBeenCalledWith("/users/permissions", { signal: undefined });
  });

  it("uses the users API for create, update, and delete", async () => {
    const post = vi.spyOn(request, "post").mockResolvedValue({ data: { item: { id: "user-1" } } } as never);
    const patch = vi.spyOn(request, "patch").mockResolvedValue({ data: { item: { id: "user-1" } } } as never);
    const remove = vi.spyOn(request, "delete").mockResolvedValue({} as never);

    await userService.create({ name: "An", username: "an", password: "secret123", role: "USER", roleId: "role-1" });
    await userService.update("user-1", { name: "An", role: "USER", roleId: null });
    await userService.remove("user-1");

    expect(post).toHaveBeenCalledWith("/users", { name: "An", username: "an", password: "secret123", role: "USER", roleId: "role-1" });
    expect(patch).toHaveBeenCalledWith("/users/user-1", { name: "An", role: "USER", roleId: null });
    expect(remove).toHaveBeenCalledWith("/users/user-1");
  });
});
