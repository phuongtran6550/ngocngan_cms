import type { ZaloStatus } from "@/views/Zalo/types";

export const ZALO_STATE_LABELS: Record<ZaloStatus["state"], string> = {
  disconnected: "Chưa kết nối",
  connected: "Đã kết nối",
  expired_access: "Access đã hết hạn",
  expired_refresh: "Cần kết nối lại",
};

export const ZALO_STATE_BADGE_CLASSES: Record<ZaloStatus["state"], string> = {
  disconnected: "badge-phoenix-secondary",
  connected: "badge-phoenix-success",
  expired_access: "badge-phoenix-warning",
  expired_refresh: "badge-phoenix-danger",
};

export function zaloStatusMessage(status: ZaloStatus | null): string {
  if (!status) return "Đang tải trạng thái Zalo OA.";
  if (!status.configured) return "Thiếu cấu hình môi trường Zalo trong backend.";
  if (status.state === "connected") return "OA đang kết nối bình thường và sẵn sàng đồng bộ.";
  if (status.state === "expired_access") return "Access token đã hết hạn, hệ thống sẽ tự refresh khi bạn kiểm tra lại.";
  if (status.state === "expired_refresh") return "Refresh token đã hết hạn, bạn cần kết nối lại từ đầu.";
  return "OA chưa được kết nối.";
}
