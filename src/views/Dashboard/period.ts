import type {
  DashboardPeriod,
  DashboardPreset,
  DashboardQuery,
} from "@/views/Dashboard/types";
import {
  calendarDateValue,
  inclusiveDateRangeError,
} from "@/utils/date-range";
import { routeQueryText } from "@/utils/route-query";

export const dashboardPresetOptions: Array<{
  value: DashboardPreset;
  label: string;
}> = [
  { value: "today", label: "Hôm nay" },
  { value: "last7Days", label: "7 ngày" },
  { value: "last30Days", label: "30 ngày" },
  { value: "currentMonth", label: "Tháng này" },
  { value: "previousMonth", label: "Tháng trước" },
  { value: "custom", label: "Tùy chọn" },
];

export const defaultDashboardQuery: DashboardQuery = {
  preset: "last30Days",
};

function isPreset(value: string): value is DashboardPreset {
  return dashboardPresetOptions.some((option) => option.value === value);
}

export function dashboardQueryFromRoute(
  query: Record<string, unknown>,
): DashboardQuery {
  const presetValue = routeQueryText(query.preset);
  const preset = isPreset(presetValue)
    ? presetValue
    : defaultDashboardQuery.preset;
  if (preset !== "custom") return { preset };
  const from = calendarDateValue(routeQueryText(query.from));
  const to = calendarDateValue(routeQueryText(query.to));
  if (inclusiveDateRangeError(from, to, { required: true })) {
    return { ...defaultDashboardQuery };
  }
  return { preset, from, to };
}

export function dashboardQueryParams(
  query: DashboardQuery,
): Record<string, string> {
  return query.preset === "custom"
    ? {
        preset: query.preset,
        from: query.from || "",
        to: query.to || "",
      }
    : { preset: query.preset };
}

export function sameDashboardQuery(
  left: DashboardQuery,
  right: DashboardQuery,
): boolean {
  return (
    left.preset === right.preset &&
    (left.from || "") === (right.from || "") &&
    (left.to || "") === (right.to || "")
  );
}

export function formatDashboardDate(value: string): string {
  if (!calendarDateValue(value)) return value || "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function dashboardCustomRangeError(from: string, to: string): string {
  return inclusiveDateRangeError(from, to, { required: true, maximumDays: 366 });
}

export function formatDashboardPeriod(period?: DashboardPeriod | null): string {
  if (!period?.from || !period.to) return "Kỳ báo cáo";
  const from = formatDashboardDate(period.from);
  const to = formatDashboardDate(period.to);
  return period.from === period.to ? from : `${from} - ${to}`;
}
