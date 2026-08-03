import { request } from "@/request";
import { dashboardQueryParams } from "@/views/Dashboard/period";
import type {
  DashboardOverview,
  DashboardQuery,
} from "@/views/Dashboard/types";

function exportFilename(header: unknown): string {
  const match = /filename="?([^";]+)"?/i.exec(String(header || ""));
  return match?.[1] || `orders-${new Date().toISOString().slice(0, 10)}.csv`;
}

export const dashboardService = {
  async overview(
    queryOrSignal?: DashboardQuery | AbortSignal,
    signal?: AbortSignal,
  ): Promise<DashboardOverview> {
    const query = isAbortSignal(queryOrSignal) ? undefined : queryOrSignal;
    const requestSignal = isAbortSignal(queryOrSignal) ? queryOrSignal : signal;
    const config = query
      ? { params: dashboardQueryParams(query), signal: requestSignal }
      : { signal: requestSignal };
    const { data } = await request.get<DashboardOverview>("/dashboard/overview", config);
    return data;
  },
  async exportOrders(query?: DashboardQuery): Promise<{ blob: Blob; filename: string }> {
    const config = query
      ? { responseType: "blob" as const, params: dashboardQueryParams(query) }
      : { responseType: "blob" as const };
    const response = await request.get<Blob>("/export/orders", config);
    return {
      blob: response.data,
      filename: exportFilename(response.headers["content-disposition"]),
    };
  },
};

function isAbortSignal(value: unknown): value is AbortSignal {
  return Boolean(
    value &&
      typeof value === "object" &&
      "aborted" in value &&
      typeof (value as AbortSignal).addEventListener === "function",
  );
}
