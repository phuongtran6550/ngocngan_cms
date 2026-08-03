import { request } from "@/request";
import type {
  DefaultPrintDeviceStatus,
  PrintBridgeRelease,
  PrintDevice,
  PrintDevicePairingCode,
  PrintPlatform,
} from "@/views/PrintDevices/types";

const endpoint = "/print-devices";
const installerDownloadTimeoutMs = 5 * 60_000;

function downloadFilename(header: unknown, fallback: string): string {
  const value = String(header || "");
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(value)?.[1];
  const quoted = /filename="([^"]+)"/i.exec(value)?.[1];
  const plain = /filename=([^;]+)/i.exec(value)?.[1];
  let candidate = encoded || quoted || plain || fallback;
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    candidate = fallback;
  }
  const safe = candidate.trim().replace(/^"|"$/g, "").split(/[\\/]/).pop();
  return safe || fallback;
}

async function throwBlobError(blob: Blob, status: number): Promise<never> {
  let message = "Không thể tải bộ cài máy in";
  let code = "PRINT_BRIDGE_DOWNLOAD_FAILED";
  try {
    const payload = JSON.parse(await blob.text()) as {
      message?: string;
      code?: string;
      errors?: { msg?: string };
    };
    message = payload.message || payload.errors?.msg || message;
    code = payload.code || code;
  } catch {
    // Keep the safe user-facing fallback when the response is not JSON.
  }
  const error = new Error(message) as Error & { code: string; status: number };
  error.code = code;
  error.status = status;
  throw error;
}

export const printDeviceService = {
  async defaultStatus(signal?: AbortSignal): Promise<DefaultPrintDeviceStatus> {
    const { data } = await request.get<DefaultPrintDeviceStatus>(
      `${endpoint}/default-status`,
      { signal },
    );
    return data;
  },

  async list(signal?: AbortSignal): Promise<PrintDevice[]> {
    const { data } = await request.get<PrintDevice[]>(endpoint, { signal });
    return data;
  },

  async releases(signal?: AbortSignal): Promise<PrintBridgeRelease[]> {
    const { data } = await request.get<PrintBridgeRelease[]>(
      `${endpoint}/releases`,
      { signal },
    );
    return data;
  },

  async downloadRelease(
    platform: PrintPlatform,
    fallbackFilename: string,
  ): Promise<{ blob: Blob; filename: string }> {
    const response = await request.get<Blob>(
      `${endpoint}/releases/${platform}/download`,
      {
        responseType: "blob",
        timeout: installerDownloadTimeoutMs,
        validateStatus: () => true,
      },
    );
    if (response.status < 200 || response.status >= 300) {
      await throwBlobError(response.data, response.status);
    }
    return {
      blob: response.data,
      filename: downloadFilename(
        response.headers["content-disposition"],
        fallbackFilename,
      ),
    };
  },

  async createPairingCode(): Promise<PrintDevicePairingCode> {
    const { data } = await request.post<PrintDevicePairingCode>(
      `${endpoint}/pairing-codes`,
      {},
    );
    return data;
  },

  async rename(deviceId: string, displayName: string): Promise<PrintDevice> {
    const { data } = await request.patch<PrintDevice>(
      `${endpoint}/${deviceId}`,
      { displayName },
    );
    return data;
  },

  async makeDefault(deviceId: string): Promise<PrintDevice> {
    const { data } = await request.patch<PrintDevice>(
      `${endpoint}/${deviceId}/default`,
      {},
    );
    return data;
  },

  async revoke(deviceId: string): Promise<void> {
    await request.delete(`${endpoint}/${deviceId}`, { data: {} });
  },
};
