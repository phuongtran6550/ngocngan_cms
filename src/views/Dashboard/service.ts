import { request } from "@/request";
import type { DashboardOverview } from "@/views/Dashboard/types";

function exportFilename(header: unknown): string {
  const match = /filename="?([^";]+)"?/i.exec(String(header || ""));
  return match?.[1] || `orders-${new Date().toISOString().slice(0, 10)}.csv`;
}

export const dashboardService = {
  async overview(signal?: AbortSignal): Promise<DashboardOverview> {
    const { data } = await request.get<DashboardOverview>("/dashboard/overview", { signal });
    return data;
  },
  async exportOrders(): Promise<{ blob: Blob; filename: string }> {
    const response = await request.get<Blob>("/export/orders", { responseType: "blob" });
    return {
      blob: response.data,
      filename: exportFilename(response.headers["content-disposition"]),
    };
  },
};
