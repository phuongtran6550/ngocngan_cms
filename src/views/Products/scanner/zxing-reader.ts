import {
  prepareZXingModule,
  purgeZXingModule,
  readBarcodes,
  type ReaderOptions,
} from "zxing-wasm/reader";
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

export type BarcodeDecodeMode = "fast" | "recovery";
export type BarcodeImageInput = Blob | ImageData;

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
  input: BarcodeImageInput,
  mode: BarcodeDecodeMode,
  binarizer?: ReaderOptions["binarizer"],
): Promise<string[]> {
  configure();
  const options = mode === "fast" ? fastOptions : recoveryOptions;
  let results: Awaited<ReturnType<typeof readBarcodes>>;
  try {
    results = await readBarcodes(input, {
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
