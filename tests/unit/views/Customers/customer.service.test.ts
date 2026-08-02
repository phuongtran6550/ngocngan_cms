import { vi } from "vitest";
import { request } from "@/request";
import { customerService } from "@/views/Customers/service";

describe("customer service", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads current customer aggregates through the shared request", async () => {
    const get = vi.spyOn(request, "get").mockResolvedValue({ data: { items: [], page: 1, limit: 20, total: 0, totalPages: 0 } } as never);

    await customerService.list("current", { page: 1, limit: 20, query: "0901", sortBy: "price", sortDirection: "desc" });

    expect(get).toHaveBeenCalledWith("/customers", {
      params: { page: 1, limit: 20, query: "0901", sortBy: "price", sortDirection: "desc" },
      signal: undefined,
    });
  });

  it("uses the dedicated history endpoint", async () => {
    const get = vi.spyOn(request, "get").mockResolvedValue({ data: { items: [], page: 1, limit: 20, total: 0, totalPages: 0 } } as never);

    await customerService.list("history", { page: 1, limit: 20 });

    expect(get).toHaveBeenCalledWith("/customers/history", expect.objectContaining({ signal: undefined }));
  });
});
