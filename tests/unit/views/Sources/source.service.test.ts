import { vi } from "vitest";
import { request } from "@/request";
import { sourceService } from "@/views/Sources/service";

describe("source service", () => {
  afterEach(() => vi.restoreAllMocks());

  it("requests import-value aggregates with sorting and pagination", async () => {
    const get = vi.spyOn(request, "get").mockResolvedValue({
      data: { items: [], page: 1, limit: 20, total: 0, totalPages: 0 },
    } as never);

    await sourceService.list({ page: 1, limit: 20, query: "0901", sortBy: "totalImportValue", sortDirection: "desc" });

    expect(get).toHaveBeenCalledWith("/source-of-goods", {
      params: { page: 1, limit: 20, query: "0901", sortBy: "totalImportValue", sortDirection: "desc" },
      signal: undefined,
    });
  });
});
