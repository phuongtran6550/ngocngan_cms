import type { ColumnDefinition } from "@/config/resource";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});
const timeFormatter = new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" });
const dollarFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatNumberValue(value: unknown): string {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue)
    ? numberFormatter.format(numericValue)
    : String(value);
}

export function formatMoney(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string" && value.includes("₫")) return value;
  return `${formatNumberValue(value)} ₫`;
}

export function formatDollar(value: unknown): string {
  if (value == null || value === "") return "—";
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? dollarFormatter.format(numericValue) : String(value);
}

export function formatDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : dateTimeFormatter.format(date);
}

export function formatResourceValue(
  value: unknown,
  column: ColumnDefinition,
): string {
  if (value == null || value === "") return "—";

  const optionLabel = column.options?.find(
    (option) => option.value === value,
  )?.label;
  if (optionLabel) return optionLabel;

  if (column.key === "type") {
    return value === "material" ? "Nhóm Trung" : "Nhóm Đại";
  }

  if (column.type === "money" || column.type === "dollar" || column.type === "number") {
    if (column.type === "money") return formatMoney(value);
    if (column.type === "dollar") return formatDollar(value);
    return formatNumberValue(value);
  }

  if (column.type === "date" || column.type === "datetime" || column.type === "time") {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      if (column.type === "datetime") return formatDateTime(value);
      return column.type === "time" ? timeFormatter.format(date) : dateFormatter.format(date);
    }
  }

  return String(value);
}

export function resourceStatusLabel(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return String(record.text || record.label || record.badge || "—");
  }
  const labels: Record<string, string> = {
    inactive: "Ngừng hoạt động",
    active: "Đang hoạt động",
    draft: "Chờ bổ sung",
    completed: "Hoàn tất",
    returned: "Đã đổi trả",
    cancelled: "Đã hủy",
    complete: "Thông tin đầy đủ",
    ocr_processing: "OCR đang xử lý",
    review_required: "Cần kiểm duyệt",
    manual_required: "Cần nhập thủ công",
  };
  return labels[String(value)] || String(value || "—");
}

export function resourceStatusClass(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const tone = String((value as Record<string, unknown>).badge || "secondary");
    return `badge-phoenix-${tone}`;
  }
  const classes: Record<string, string> = {
    inactive: "badge-phoenix-secondary",
    active: "badge-phoenix-success",
    draft: "badge-phoenix-warning",
    completed: "badge-phoenix-success",
    returned: "badge-phoenix-info",
    cancelled: "badge-phoenix-danger",
    complete: "badge-phoenix-success",
    ocr_processing: "badge-phoenix-info",
    review_required: "badge-phoenix-warning",
    manual_required: "badge-phoenix-danger",
  };
  return classes[String(value)] || "badge-phoenix-secondary";
}
