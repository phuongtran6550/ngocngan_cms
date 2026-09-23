export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_EDGE = 960;
export const JPEG_QUALITY = 0.72;
export const ORDER_PHOTO_IMAGE_OPTIMIZATION = Object.freeze({
  maxEdge: 1280,
  jpegQuality: 0.76,
});
export const ALLOWED_IMAGE_MIME_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export const IMAGE_FILE_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");

export type ImageOptimizationProgress = (progress: number) => void;

export interface ImageOptimizationOptions {
  maxEdge?: number;
  jpegQuality?: number;
}

export function validateImageFile(file: Pick<File, "type" | "size">): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase())) {
    throw new Error("Ảnh phải có định dạng JPG, PNG hoặc WEBP");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Ảnh vượt quá giới hạn 25 MB");
  }
}

export function calculateContainSize(width: number, height: number, maxEdge = MAX_IMAGE_EDGE) {
  if (width <= 0 || height <= 0) throw new Error("Kích thước ảnh không hợp lệ");
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function parseExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return 1;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset, false);
    const length = view.getUint16(offset + 2, false);
    if (length < 2 || offset + 2 + length > view.byteLength) break;
    if (marker === 0xffe1 && length >= 14 && view.getUint32(offset + 4, false) === 0x45786966) {
      const tiff = offset + 10;
      const littleEndian = view.getUint16(tiff, false) === 0x4949;
      if (view.getUint16(tiff + 2, littleEndian) !== 0x002a) return 1;
      const firstIfd = tiff + view.getUint32(tiff + 4, littleEndian);
      if (firstIfd + 2 > view.byteLength) return 1;
      const entries = view.getUint16(firstIfd, littleEndian);
      for (let index = 0; index < entries; index += 1) {
        const entry = firstIfd + 2 + index * 12;
        if (entry + 12 > view.byteLength) return 1;
        if (view.getUint16(entry, littleEndian) === 0x0112) {
          const orientation = view.getUint16(entry + 8, littleEndian);
          return orientation >= 1 && orientation <= 8 ? orientation : 1;
        }
      }
      return 1;
    }
    offset += 2 + length;
  }
  return 1;
}

function imageFileName(name: string): string {
  const stem = name.replace(/\.[^.]+$/, "") || "image";
  return `${stem}.jpg`;
}

function canvasBlob(canvas: HTMLCanvasElement, jpegQuality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Không thể tối ưu ảnh đã chọn"));
    }, "image/jpeg", jpegQuality);
  });
}

function transformForOrientation(
  context: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number,
): void {
  switch (orientation) {
    case 2: context.transform(-1, 0, 0, 1, width, 0); break;
    case 3: context.transform(-1, 0, 0, -1, width, height); break;
    case 4: context.transform(1, 0, 0, -1, 0, height); break;
    case 5: context.transform(0, 1, 1, 0, 0, 0); break;
    case 6: context.transform(0, 1, -1, 0, height, 0); break;
    case 7: context.transform(0, -1, -1, 0, height, width); break;
    case 8: context.transform(0, -1, 1, 0, 0, width); break;
  }
}

async function decodeImage(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== "function") {
    throw new Error("Trình duyệt không hỗ trợ tối ưu ảnh");
  }
  return createImageBitmap(file, { imageOrientation: "none" });
}

export async function optimizeImage(
  file: File,
  onProgress: ImageOptimizationProgress = () => undefined,
  options: ImageOptimizationOptions = {},
): Promise<File> {
  validateImageFile(file);
  onProgress(5);
  const buffer = await file.arrayBuffer();
  const orientation = file.type === "image/jpeg" ? parseExifOrientation(buffer) : 1;
  onProgress(20);

  const image = await decodeImage(file);
  try {
    const maxEdge = Number.isFinite(options.maxEdge) && Number(options.maxEdge) > 0
      ? Number(options.maxEdge)
      : MAX_IMAGE_EDGE;
    const jpegQuality = Number.isFinite(options.jpegQuality)
      ? Math.min(1, Math.max(0.1, Number(options.jpegQuality)))
      : JPEG_QUALITY;
    const rotated = orientation >= 5 && orientation <= 8;
    const sourceWidth = image.width;
    const sourceHeight = image.height;
    const target = calculateContainSize(
      rotated ? sourceHeight : sourceWidth,
      rotated ? sourceWidth : sourceHeight,
      maxEdge,
    );
    const scale = target.width / (rotated ? sourceHeight : sourceWidth);
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể khởi tạo bộ xử lý ảnh");

    context.scale(scale, scale);
    transformForOrientation(context, orientation, sourceWidth, sourceHeight);
    context.drawImage(image, 0, 0);
    onProgress(75);
    const blob = await canvasBlob(canvas, jpegQuality);
    onProgress(100);
    return new File([blob], imageFileName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    image.close();
  }
}
