const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function calendarDateTimestamp(value: string): number | null {
  if (!CALENDAR_DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? timestamp
    : null;
}

export function calendarDateValue(value: unknown): string {
  const normalized = String(value || "").trim();
  return calendarDateTimestamp(normalized) === null ? "" : normalized;
}

export function inclusiveDateRangeError(
  from: string,
  to: string,
  { required = false, maximumDays = 366 } = {},
): string {
  if (!from && !to) return required ? "Vui lòng chọn ngày bắt đầu và ngày kết thúc" : "";
  if (!from || !to) return "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc";
  const start = calendarDateTimestamp(from);
  const end = calendarDateTimestamp(to);
  if (start === null || end === null) return "Ngày đã chọn không hợp lệ";
  if (start > end) return "Ngày bắt đầu không được sau ngày kết thúc";
  const days = Math.round((end - start) / DAY_MS) + 1;
  return days > maximumDays
    ? `Khoảng thời gian không được vượt quá ${maximumDays} ngày`
    : "";
}
