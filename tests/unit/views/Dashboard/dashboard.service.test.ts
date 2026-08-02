import { vi } from "vitest";
import { request } from "@/request";
import { dashboardService } from "@/views/Dashboard/service";

describe("dashboard service", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads overview through the shared request client", async () => {
    const get = vi.spyOn(request, "get").mockResolvedValue({ data: { kpis: {} } } as never);
    await dashboardService.overview();
    expect(get).toHaveBeenCalledWith("/dashboard/overview", { signal: undefined });
  });

  it("downloads order CSV as a blob through the shared request client", async () => {
    const blob = new Blob(["csv"], { type: "text/csv" });
    const get = vi.spyOn(request, "get").mockResolvedValue({
      data: blob,
      headers: { "content-disposition": 'attachment; filename="orders-2026-07-27.csv"' },
    } as never);

    const result = await dashboardService.exportOrders();

    expect(get).toHaveBeenCalledWith("/export/orders", { responseType: "blob" });
    expect(result).toEqual({ blob, filename: "orders-2026-07-27.csv" });
  });
});
