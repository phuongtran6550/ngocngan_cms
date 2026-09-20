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
}

interface ExtendedTrackConstraintSet extends MediaTrackConstraintSet {
  focusMode?: string;
  torch?: boolean;
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

export async function requestEnvironmentCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw unsupportedCameraError();

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
  } catch (error) {
    if (!isOverconstrained(error)) throw error;
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: "environment" },
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
