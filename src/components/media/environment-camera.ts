export type EnvironmentCameraErrorCode =
  "unsupported" | "permission-denied" | "no-camera" | "camera";

export interface EnvironmentCameraError {
  code: EnvironmentCameraErrorCode;
  cause?: unknown;
}

interface CameraCodedError extends Error {
  cameraCode?: EnvironmentCameraErrorCode;
}

interface ExtendedTrackCapabilities extends MediaTrackCapabilities {
  focusMode?: string[];
  torch?: boolean;
  zoom?: { min?: number; max?: number; step?: number };
}

interface ExtendedTrackConstraintSet extends MediaTrackConstraintSet {
  focusMode?: string;
  torch?: boolean;
  zoom?: number;
}

function unsupportedCameraError(): CameraCodedError {
  const error = new Error("Camera API is unavailable") as CameraCodedError;
  error.cameraCode = "unsupported";
  return error;
}

function isOverconstrained(error: unknown): boolean {
  return (
    String((error as DOMException | undefined)?.name || "") ===
    "OverconstrainedError"
  );
}

export function normalizeEnvironmentCameraError(
  error: unknown,
): EnvironmentCameraError {
  const code = (error as CameraCodedError | undefined)?.cameraCode;
  if (code) return { code, cause: error };

  const name = String((error as DOMException | undefined)?.name || "");
  if (name === "NotAllowedError" || name === "SecurityError") {
    return { code: "permission-denied", cause: error };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return { code: "no-camera", cause: error };
  }
  return { code: "camera", cause: error };
}

export async function listEnvironmentCameraDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === "videoinput");
    // Only return back-facing cameras with identifiable labels to prevent switching to front camera on iOS
    return videoInputs.filter((d) => {
      const label = (d.label || "").toLowerCase();
      if (!label) return false;
      if (label.includes("front") || label.includes("user")) return false;
      return (
        label.includes("back") ||
        label.includes("rear") ||
        label.includes("environment") ||
        label.includes("sau")
      );
    });
  } catch {
    return [];
  }
}

export async function getBestEnvironmentCameraDeviceId(): Promise<string | undefined> {
  if (!navigator.mediaDevices?.enumerateDevices) return undefined;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === "videoinput");
    if (videoInputs.length <= 1) return undefined;

    // Check if labels are accessible (on iOS Safari before permission or due to privacy, labels may be empty)
    const hasLabels = videoInputs.some((d) => Boolean(d.label));
    if (!hasLabels) {
      // If no labels, do NOT guess by index (which might pick the front camera on iPhone).
      // Return undefined so browser relies on facingMode: "environment"
      return undefined;
    }

    // Filter to confirmed back-facing cameras
    const backCameras = videoInputs.filter((d) => {
      const label = (d.label || "").toLowerCase();
      if (label.includes("front") || label.includes("user")) return false;
      return (
        label.includes("back") ||
        label.includes("rear") ||
        label.includes("environment") ||
        label.includes("sau")
      );
    });

    if (backCameras.length <= 1) return backCameras[0]?.deviceId;

    // Look for primary wide lens (avoid telephoto, zoom, macro, ultra-wide)
    const mainCamera = backCameras.find((d) => {
      const label = (d.label || "").toLowerCase();
      const isUltraWide =
        label.includes("ultra") ||
        label.includes("0.5") ||
        label.includes("0.6") ||
        label.includes("siêu rộng");
      const isTele =
        label.includes("tele") ||
        label.includes("zoom") ||
        label.includes("macro") ||
        label.includes("depth");
      if (isUltraWide || isTele) return false;
      return (
        label.includes("main") ||
        label.includes("wide") ||
        label.includes("chính") ||
        label.includes("0")
      );
    });

    return mainCamera?.deviceId || backCameras[0]?.deviceId;
  } catch {
    return undefined;
  }
}

export async function requestEnvironmentCamera(
  deviceId?: string,
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw unsupportedCameraError();

  const isPortrait =
    typeof window !== "undefined" &&
    window.innerHeight > window.innerWidth;

  let targetDeviceId = deviceId;
  if (!targetDeviceId) {
    targetDeviceId = await getBestEnvironmentCameraDeviceId();
  }

  const baseConstraints: MediaTrackConstraints = targetDeviceId
    ? { deviceId: { exact: targetDeviceId } }
    : { facingMode: { ideal: "environment" } };

  // 1. Preferred: Orientation-adaptive with 3:4 / 4:3 aspect ratio (avoids sensor crop on mobile)
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...baseConstraints,
        width: { ideal: isPortrait ? 1080 : 1920 },
        height: { ideal: isPortrait ? 1920 : 1080 },
        aspectRatio: { ideal: isPortrait ? 3 / 4 : 4 / 3 },
      },
    });
  } catch (error) {
    if (!isOverconstrained(error)) throw error;
  }

  // 2. Adaptive resolution without aspect ratio constraint
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...baseConstraints,
        width: { ideal: isPortrait ? 1080 : 1920 },
        height: { ideal: isPortrait ? 1920 : 1080 },
      },
    });
  } catch (error) {
    if (!isOverconstrained(error)) throw error;
  }

  // 3. Fallback: 1920x1080 landscape
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...baseConstraints,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
  } catch (error) {
    if (!isOverconstrained(error)) throw error;
  }

  // 4. Fallback: deviceId or facingMode without dimension constraints (lets sensor choose native FOV)
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: baseConstraints.deviceId
        ? baseConstraints
        : { facingMode: "environment" },
    });
  } catch (error) {
    if (!isOverconstrained(error)) throw error;
  }

  return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
}

export async function attachEnvironmentCamera(
  video: HTMLVideoElement,
  stream: MediaStream,
): Promise<void> {
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
}

export function stopEnvironmentCamera(
  stream: MediaStream | null,
  video?: HTMLVideoElement | null,
): void {
  for (const track of stream?.getTracks() || []) track.stop();
  if (video && (!stream || video.srcObject === stream)) {
    video.srcObject = null;
  }
}

export async function prepareEnvironmentCameraTrack(
  track: MediaStreamTrack,
): Promise<{ torchAvailable: boolean }> {
  let capabilities: ExtendedTrackCapabilities | undefined;
  try {
    capabilities = track.getCapabilities?.() as ExtendedTrackCapabilities;
  } catch {
    return { torchAvailable: false };
  }

  // Reset hardware zoom to baseline if available to prevent sensor zoom trap on Samsung/Oppo
  if (capabilities?.zoom) {
    const minZoom = capabilities.zoom.min ?? 1;
    await track
      .applyConstraints({
        advanced: [
          { zoom: Math.max(1, minZoom) } as ExtendedTrackConstraintSet,
        ],
      })
      .catch(() => undefined);
  }

  if (capabilities?.focusMode?.includes("continuous")) {
    await track
      .applyConstraints({
        advanced: [{ focusMode: "continuous" } as ExtendedTrackConstraintSet],
      })
      .catch(() => undefined);
  }

  return { torchAvailable: capabilities?.torch === true };
}

export async function setEnvironmentCameraTorch(
  track: MediaStreamTrack,
  enabled: boolean,
): Promise<void> {
  await track.applyConstraints({
    advanced: [{ torch: enabled } as ExtendedTrackConstraintSet],
  });
}

export type EnvironmentCameraFocusResult = "point" | "auto" | "unsupported";
export interface EnvironmentCameraFocusPoint {
  x: number;
  y: number;
}

export async function setEnvironmentCameraFocus(
  track: MediaStreamTrack,
  point: EnvironmentCameraFocusPoint,
): Promise<EnvironmentCameraFocusResult> {
  if (
    ![point.x, point.y].every(
      (value) => Number.isFinite(value) && value >= 0 && value <= 1,
    )
  ) {
    throw new RangeError("Focus point must be inside the camera frame");
  }
  let modes: string[];
  try {
    modes =
      (track.getCapabilities?.() as ExtendedTrackCapabilities)?.focusMode || [];
  } catch {
    return "unsupported";
  }
  const mode = modes.includes("continuous")
    ? "continuous"
    : modes.includes("single-shot")
      ? "single-shot"
      : "";
  if (!mode) return "unsupported";
  const supported = navigator.mediaDevices?.getSupportedConstraints?.() as
    | (MediaTrackSupportedConstraints & { pointsOfInterest?: boolean })
    | undefined;
  const settings = () =>
    track.getSettings() as MediaTrackSettings & {
      focusMode?: string;
      pointsOfInterest?: EnvironmentCameraFocusPoint[];
    };
  const previous = track.getConstraints?.() || {};
  const retained = { ...previous } as MediaTrackConstraints & {
    focusMode?: unknown;
    pointsOfInterest?: unknown;
  };
  delete retained.focusMode;
  delete retained.pointsOfInterest;
  const controls = Object.assign({}, ...(previous.advanced || []));
  delete controls.focusMode;
  delete controls.pointsOfInterest;
  const apply = (point?: EnvironmentCameraFocusPoint) =>
    track.applyConstraints({
      ...retained,
      advanced: [
        {
          ...controls,
          focusMode: mode,
          ...(point ? { pointsOfInterest: [point] } : {}),
        } as ExtendedTrackConstraintSet,
      ],
    });
  if (supported?.pointsOfInterest) {
    try {
      await apply(point);
      const current = settings();
      if (
        current.focusMode === mode &&
        current.pointsOfInterest?.some(
          (value) =>
            Math.abs(value.x - point.x) <= 0.02 &&
            Math.abs(value.y - point.y) <= 0.02,
        )
      )
        return "point";
    } catch {
      /* Unsupported device constraints fall back to its automatic focus mode. */
    }
  }
  try {
    await apply();
    return settings().focusMode === mode ? "auto" : "unsupported";
  } catch {
    return "unsupported";
  }
}
