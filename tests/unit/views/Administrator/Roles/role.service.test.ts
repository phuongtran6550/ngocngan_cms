import { vi } from "vitest";
import { request } from "@/request";
import { roleService } from "@/views/Administrator/Roles/service";

describe("role service", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the shared request client for list filters", async () => {
    const get = vi.spyOn(request, "get").mockResolvedValue({
      data: { items: [], page: 1, limit: 20, total: 0, totalPages: 0 },
    } as never);

    await roleService.list({ page: 1, limit: 20, query: "kho", system: "custom" });

    expect(get).toHaveBeenCalledWith("/roles", {
      params: { page: 1, limit: 20, query: "kho", system: "custom" },
      signal: undefined,
    });
  });

  it("loads the grouped permission catalog from the role API", async () => {
    const get = vi.spyOn(request, "get").mockResolvedValue({ data: { items: [], groups: [] } } as never);

    await roleService.permissions();

    expect(get).toHaveBeenCalledWith("/roles/permissions", { signal: undefined });
  });
});
