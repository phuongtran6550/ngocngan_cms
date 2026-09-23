import {
  prepareZXingModule,
  purgeZXingModule,
  readBarcodes,
  type ReaderOptions,
} from "zxing-wasm/reader";
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

export type BarcodeDecodeMode = "fast" | "recovery";
export type BarcodeImageInput = Blob | ImageData;
export type BarcodeDetectableSource = BarcodeImageInput | HTMLVideoElement;

interface DetectedBarcode {
  rawValue?: string;
  format?: string;
}

interface NativeBarcodeDetector {
  detect(source: unknown): Promise<DetectedBarcode[]>;
}

let nativeDetectorPromise: Promise<NativeBarcodeDetector | null> | null = null;

export function isNativeBarcodeDetectorSupported(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export async function getNativeBarcodeDetector(): Promise<NativeBarcodeDetector | null> {
  if (!isNativeBarcodeDetectorSupported()) return null;
  if (!nativeDetectorPromise) {
    nativeDetectorPromise = (async () => {
      try {
        const Detector = (
          window as unknown as {
            BarcodeDetector: {
              getSupportedFormats?: () => Promise<string[]>;
              new (opt?: { formats: string[] }): NativeBarcodeDetector;
            };
          }
        ).BarcodeDetector;
        if (!Detector?.getSupportedFormats) return null;
        const formats = await Detector.getSupportedFormats();
        if (formats.includes("code_128")) {
          return new Detector({ formats: ["code_128"] });
        }
      } catch {
        return null;
      }
      return null;
    })();
  }
  return nativeDetectorPromise;
}

const locateFile = (path: string, prefix: string): string =>
  path.endsWith(".wasm") ? wasmUrl : `${prefix}${path}`;
const overrides = { locateFile };
let configured = false;
let preloadPromise: Promise<unknown> | null = null;

const fastOptions: ReaderOptions = {
  formats: ["Code128"],
  tryHarder: false,
  tryRotate: true,
  tryInvert: false,
  tryDownscale: true,
  minLineCount: 2,
  maxNumberOfSymbols: 1,
};

const recoveryOptions: ReaderOptions = {
  formats: ["Code128"],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  minLineCount: 2,
  maxNumberOfSymbols: 4,
};

function configure(): void {
  if (configured) return;
  prepareZXingModule({ overrides });
  configured = true;
}

function resetReader(): void {
  purgeZXingModule();
  configured = false;
  preloadPromise = null;
}

export function preloadBarcodeReader(): Promise<unknown> {
  if (isNativeBarcodeDetectorSupported()) {
    void getNativeBarcodeDetector();
  }
  configure();
  if (!preloadPromise) {
    preloadPromise = Promise.resolve()
      .then(() => prepareZXingModule({ overrides, fireImmediately: true }))
      .catch((error) => {
        // zxing-wasm caches rejected module promises internally until purged.
        resetReader();
        throw error;
      });
  }
  return preloadPromise;
}

export async function readBarcodeValues(
  input: BarcodeDetectableSource,
  mode: BarcodeDecodeMode,
  binarizer?: ReaderOptions["binarizer"],
): Promise<string[]> {
  const native = await getNativeBarcodeDetector();
  if (native) {
    try {
      const results = await native.detect(input);
      if (results && results.length > 0) {
        const barcodes = results
          .filter(
            (r) =>
              r.rawValue &&
              r.rawValue.trim() &&
              (r.format === "code_128" || !r.format),
          )
          .map((r) => r.rawValue!.trim());
        if (barcodes.length > 0) return barcodes;
      }
    } catch {
      // In case native detector encounters an error, fall through to WASM
    }
  }

  if (
    typeof HTMLVideoElement !== "undefined" &&
    input instanceof HTMLVideoElement
  ) {
    return [];
  }

  configure();
  const options = mode === "fast" ? fastOptions : recoveryOptions;
  let results: Awaited<ReturnType<typeof readBarcodes>>;
  try {
    results = await readBarcodes(input as BarcodeImageInput, {
      ...options,
      ...(binarizer ? { binarizer } : {}),
    });
  } catch (error) {
    resetReader();
    throw error;
  }
  return results
    .filter(
      (result) =>
        result.isValid && result.format === "Code128" && result.text.trim(),
    )
    .map((result) => result.text.trim());
}
