import type { DefaultPrintDeviceStatus } from "@/views/PrintDevices/types";

export interface PrintDevicePresentation {
  ready: boolean;
  tone: "success" | "warning" | "danger" | "secondary";
  title: string;
  description: string;
  action: "setup" | "retry" | null;
}

export function printDevicePresentation(
  status: DefaultPrintDeviceStatus | null,
): PrintDevicePresentation {
  if (!status) {
    return {
      ready: false,
      tone: "warning",
      title: "Không thể kiểm tra máy in.",
      description: "Hãy kiểm tra lại trước khi in tem.",
      action: "retry",
    };
  }

  if (!status.configured) {
    return {
      ready: false,
      tone: "warning",
      title: "Hệ thống chưa được kết nối với máy in tem.",
      description: "Người quản trị cần thiết lập máy in trước khi sử dụng.",
      action: "setup",
    };
  }

  if (!status.bridgeOnline || status.readiness === "bridgeOffline") {
    return {
      ready: false,
      tone: "warning",
      title: "Ứng dụng in trên máy tính đang tắt.",
      description: "Hãy mở Ứng dụng in Ngọc Châu rồi kiểm tra lại.",
      action: "retry",
    };
  }

  if (status.readiness === "offline") {
    return {
      ready: false,
      tone: "danger",
      title: "Không thể kết nối GoDEX G500. Hãy kiểm tra nguồn và cáp USB.",
      description: "Sau khi kết nối lại, hãy kiểm tra trạng thái máy in.",
      action: "retry",
    };
  }

  if (status.readiness === "missing") {
    return {
      ready: false,
      tone: "danger",
      title:
        "Máy tính không còn nhận GoDEX G500. Vui lòng liên hệ người quản trị.",
      description:
        "Không thay đổi driver hoặc cài đặt máy in tại màn hình này.",
      action: "retry",
    };
  }

  if (status.readiness !== "ready") {
    return {
      ready: false,
      tone: "danger",
      title: "GoDEX G500 chưa sẵn sàng.",
      description: "Hãy kiểm tra máy in rồi thử lại.",
      action: "retry",
    };
  }

  return {
    ready: true,
    tone: "success",
    title: "GoDEX G500 đã sẵn sàng.",
    description: status.displayName
      ? `Tem sẽ được gửi đến ${status.displayName}.`
      : "Bạn có thể in tem ngay.",
    action: null,
  };
}

const printFailureMessages: Record<string, string> = {
  PRINT_DEVICE_NOT_CONFIGURED: "Hệ thống chưa được kết nối với máy in tem.",
  PRINT_DEVICE_OFFLINE:
    "Không thể kết nối GoDEX G500. Hãy kiểm tra nguồn, cáp USB và Ứng dụng in Ngọc Châu rồi thử lại.",
  PRINT_DEVICE_REVOKED:
    "Kết nối máy in đã bị ngắt. Vui lòng liên hệ người quản trị.",
  LABEL_PRINTER_MISSING:
    "Máy tính không còn nhận GoDEX G500. Vui lòng liên hệ người quản trị.",
  LABEL_PRINTER_OFFLINE:
    "Không thể kết nối GoDEX G500. Hãy kiểm tra nguồn và cáp USB.",
  LABEL_PRINT_RETRY_EXHAUSTED:
    "Không thể gửi tem đến GoDEX G500 sau nhiều lần thử. Hãy kiểm tra máy in rồi thử lại.",
  LABEL_PRINT_FAILED:
    "Không thể gửi tem đến GoDEX G500. Hãy kiểm tra máy in rồi thử lại.",
};

export function labelPrintFailureMessage(
  code: string | undefined,
  skuCode: string,
): string {
  return (
    (code ? printFailureMessages[code] : undefined) ||
    `Không thể gửi tem SKU ${skuCode || "không xác định"} đến GoDEX G500. Hãy thử lại.`
  );
}
