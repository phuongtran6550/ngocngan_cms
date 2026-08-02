export type ZaloConnectionState = "disconnected" | "connected" | "expired_access" | "expired_refresh";

export interface ZaloAccount {
  id: string;
  name: string;
  avatar: string;
}

export interface ZaloStatus {
  configured: boolean;
  connected: boolean;
  state: ZaloConnectionState;
  oa: ZaloAccount | null;
  connectedAt: string | null;
  connectedBy: string;
  accessExpiresAt: string | null;
  refreshExpiresAt: string | null;
  lastRefreshedAt: string | null;
  pendingStateExpiresAt: string | null;
  reconnectRequired: boolean;
  retryAfterSeconds: number;
}

export interface ZaloAuthUrlResponse {
  url: string;
  stateExpiresAt: string | null;
}

export interface ZaloCallbackInput {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
}
