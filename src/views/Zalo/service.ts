import { request } from "@/request";
import type {
  ZaloAuthUrlResponse,
  ZaloCallbackInput,
  ZaloStatus,
} from "@/views/Zalo/types";

export const zaloService = {
  async status(signal?: AbortSignal): Promise<ZaloStatus> {
    const { data } = await request.get<ZaloStatus>("/zalo/status", { signal });
    return data;
  },
  async authUrl(signal?: AbortSignal): Promise<ZaloAuthUrlResponse> {
    const { data } = await request.get<ZaloAuthUrlResponse>("/zalo/auth-url", { signal });
    return data;
  },
  async callback(payload: ZaloCallbackInput): Promise<ZaloStatus> {
    const { data } = await request.post<ZaloStatus>("/zalo/callback", payload);
    return data;
  },
  async disconnect(): Promise<void> {
    await request.delete("/zalo/disconnect");
  },
};
