export type PrintPlatform = "windows" | "macos";
export type PrintReadiness =
  | "ready"
  | "offline"
  | "missing"
  | "error"
  | "bridgeOffline";

export interface DefaultPrintDeviceStatus {
  configured: boolean;
  deviceId?: string;
  displayName?: string;
  platform?: PrintPlatform;
  readiness?: PrintReadiness;
  bridgeOnline: boolean;
  lastSeenAt?: string | null;
}

export interface PrintDevice {
  deviceId: string;
  displayName: string;
  platform: PrintPlatform;
  version: string;
  status: "active" | "revoked";
  isDefault: boolean;
  readiness: PrintReadiness;
  bridgeOnline: boolean;
  lastSeenAt: string | null;
}

export interface PrintDevicePairingCode {
  code: string;
  expiresAt: string;
}

export interface PrintBridgeRelease {
  platform: PrintPlatform;
  version: string;
  available: boolean;
  filename: string;
  size: number | null;
  sha256: string | null;
}
