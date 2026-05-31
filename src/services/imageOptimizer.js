export const ORDER_IMAGE_MAX_EDGE = 960;
export const ORDER_IMAGE_QUALITY = 0.72;
const ORDER_IMAGE_TYPE = 'image/jpeg';

/**
 * Maximum raw camera photo size we attempt to optimise.
 * Images larger than this are rejected early with a clear message.
 */
const MAX_INPUT_SIZE = 25 * 1024 * 1024;

function targetSize(width, height, maxEdge) {
  const longest = Math.max(width, height);
  if (!longest || longest <= maxEdge) {
    return { width, height };
  }

  const ratio = maxEdge / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Không thể tối ưu ảnh'));
      }
    }, type, quality);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể đọc ảnh'));
    };
    image.src = url;
  });
}

function createCanvas(width, height) {
  if ('OffscreenCanvas' in window) {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// ─── JPEG header probe ─────────────────────────────────────────
// Reads the first ~128 KB to extract dimensions and EXIF Orientation.
// This avoids loading the whole image in memory.

async function probeJpegMeta(file) {
  let width = 0;
  let height = 0;
  let orientation = 1;

  try {
    const slice = file.slice(0, 128 * 1024);
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    // Must start with JPEG SOI
    if (view.byteLength < 4 || view.getUint8(0) !== 0xff || view.getUint8(1) !== 0xd8) {
      return null;
    }

    let offset = 2;
    while (offset < view.byteLength - 2) {
      if (view.getUint8(offset) !== 0xff) {
        offset++;
        continue;
      }

      const marker = view.getUint8(offset + 1);
      if (marker === 0xff) {
        offset++;
        continue;
      }

      if (marker === 0xd9) {
        break; // End of image
      }

      if (offset + 4 > view.byteLength) break;
      const length = view.getUint16(offset + 2);

      // APP1 (EXIF) marker: 0xFF 0xE1
      if (marker === 0xe1 && offset + 4 + length <= view.byteLength) {
        const app1Start = offset + 4;
        // Verify EXIF header
        if (
          view.getUint32(app1Start) === 0x45786966 && // "Exif"
          view.getUint16(app1Start + 4) === 0x0000     // "\0\0"
        ) {
          const tiffStart = app1Start + 6;
          const isLittleEndian = view.getUint16(tiffStart) === 0x4949; // "II"
          if (view.getUint16(tiffStart + 2, isLittleEndian) === 0x002a) {
            const firstIfdOffset = view.getUint32(tiffStart + 4, isLittleEndian);
            const ifdOffset = tiffStart + firstIfdOffset;
            if (ifdOffset < view.byteLength - 2) {
              const numEntries = view.getUint16(ifdOffset, isLittleEndian);
              let entryOffset = ifdOffset + 2;
              for (let i = 0; i < numEntries; i++) {
                if (entryOffset + 12 > view.byteLength) break;
                const tag = view.getUint16(entryOffset, isLittleEndian);
                if (tag === 0x0112) { // Orientation tag
                  const type = view.getUint16(entryOffset + 2, isLittleEndian);
                  let val = 1;
                  if (type === 3) { // SHORT
                    val = view.getUint16(entryOffset + 8, isLittleEndian);
                  } else if (type === 4) { // LONG
                    val = view.getUint32(entryOffset + 8, isLittleEndian);
                  }
                  if (val >= 1 && val <= 8) {
                    orientation = val;
                  }
                  break;
                }
                entryOffset += 12;
              }
            }
          }
        }
      }

      // SOF markers (dimensions)
      if (
        marker >= 0xc0 && marker <= 0xcf
        && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      ) {
        if (offset + 9 <= view.byteLength) {
          height = view.getUint16(offset + 5);
          width = view.getUint16(offset + 7);
        }
      }

      offset += 2 + length;
    }
  } catch {
    // Graceful fallback
  }

  if (width > 0 && height > 0) {
    return { width, height, orientation };
  }
  return null;
}

// Draw image element/bitmap to canvas with EXIF orientation correction.
function drawImageToCanvas(context, bitmap, width, height, orientation, browserAutoOriented) {
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);

  if (!browserAutoOriented && orientation > 1) {
    context.save();
    switch (orientation) {
      case 2: // mirror horizontal
        context.translate(width, 0);
        context.scale(-1, 1);
        break;
      case 3: // rotate 180
        context.translate(width, height);
        context.rotate(Math.PI);
        break;
      case 4: // mirror vertical
        context.translate(0, height);
        context.scale(1, -1);
        break;
      case 5: // mirror horizontal + rotate 270 CW
        context.rotate(Math.PI / 2);
        context.scale(1, -1);
        break;
      case 6: // rotate 90 CW
        context.translate(width, 0);
        context.rotate(Math.PI / 2);
        break;
      case 7: // mirror horizontal + rotate 90 CW
        context.rotate(-Math.PI / 2);
        context.scale(-1, 1);
        break;
      case 8: // rotate 270 CW
        context.translate(0, height);
        context.rotate(-Math.PI / 2);
        break;
    }

    if (orientation >= 5 && orientation <= 8) {
      context.drawImage(bitmap, 0, 0, height, width);
    } else {
      context.drawImage(bitmap, 0, 0, width, height);
    }
    context.restore();
  } else {
    context.drawImage(bitmap, 0, 0, width, height);
  }
}

// ─── Efficient large-image path ────────────────────────────────
// Uses createImageBitmap with { resizeWidth, resizeHeight } and EXIF corrections.

async function optimizeLargeJpeg(file, meta, maxEdge, quality) {
  const isSwapped = meta.orientation >= 5 && meta.orientation <= 8;
  const visualWidth = isSwapped ? meta.height : meta.width;
  const visualHeight = isSwapped ? meta.width : meta.height;

  const { width, height } = targetSize(visualWidth, visualHeight, maxEdge);

  const bitmap = await createImageBitmap(file, {
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: 'high'
  });

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d', { alpha: false });

  // If the browser already resized according to EXIF, bitmap size matches visual size
  const browserAutoOriented = bitmap.width === width || bitmap.width === height;

  drawImageToCanvas(ctx, bitmap, width, height, meta.orientation, browserAutoOriented);
  bitmap.close();

  const blob = canvas.convertToBlob
    ? await canvas.convertToBlob({ type: ORDER_IMAGE_TYPE, quality })
    : await canvasToBlob(canvas, ORDER_IMAGE_TYPE, quality);

  return { blob, width, height };
}

// ─── Standard path (all image types) ───────────────────────────

async function optimizeStandard(file, meta, maxEdge, quality) {
  let bitmap;
  if ('createImageBitmap' in window) {
    bitmap = await createImageBitmap(file);
  } else {
    bitmap = await loadImage(file);
  }

  const physicalWidth = bitmap.width || bitmap.naturalWidth;
  const physicalHeight = bitmap.height || bitmap.naturalHeight;

  const orientation = meta?.orientation || 1;
  const isSwapped = orientation >= 5 && orientation <= 8;
  const visualWidth = isSwapped ? physicalHeight : physicalWidth;
  const visualHeight = isSwapped ? physicalWidth : physicalHeight;

  const { width, height } = targetSize(visualWidth, visualHeight, maxEdge);
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d', { alpha: false });

  // Detect if browser auto-applied orientation
  const currentWidth = bitmap.width || bitmap.naturalWidth;
  const browserAutoOriented = currentWidth === visualWidth;

  drawImageToCanvas(context, bitmap, width, height, orientation, browserAutoOriented);

  if (typeof bitmap.close === 'function') {
    bitmap.close();
  }

  const blob = canvas.convertToBlob
    ? await canvas.convertToBlob({ type: ORDER_IMAGE_TYPE, quality })
    : await canvasToBlob(canvas, ORDER_IMAGE_TYPE, quality);

  return { blob, width, height };
}

// ─── Public API ────────────────────────────────────────────────

export async function optimizeOrderImage(file, options = {}) {
  if (!file || !file.type?.startsWith('image/')) {
    return { file, optimized: false, originalSize: file?.size || 0, optimizedSize: file?.size || 0 };
  }

  if (file.size > MAX_INPUT_SIZE) {
    throw new Error(`Ảnh quá lớn (${Math.round(file.size / 1024 / 1024)}MB). Vui lòng chọn ảnh nhỏ hơn 25MB.`);
  }

  const startedAt = performance.now();
  const maxEdge = options.maxEdge || ORDER_IMAGE_MAX_EDGE;
  const quality = options.quality || ORDER_IMAGE_QUALITY;

  const meta = await probeJpegMeta(file);

  // Fast-path: small JPEG already within target dimensions
  if (file.type === 'image/jpeg' && file.size <= 500 * 1024 && meta) {
    const isSwapped = meta.orientation >= 5 && meta.orientation <= 8;
    const visualWidth = isSwapped ? meta.height : meta.width;
    const visualHeight = isSwapped ? meta.width : meta.height;

    if (Math.max(visualWidth, visualHeight) <= maxEdge) {
      return {
        file,
        optimized: true,
        originalSize: file.size,
        optimizedSize: file.size,
        durationMs: Math.round(performance.now() - startedAt),
        width: visualWidth,
        height: visualHeight
      };
    }
  }

  // Large JPEG fast-path: probe header → createImageBitmap with resize options
  let result = null;
  if (
    file.type === 'image/jpeg'
    && file.size > 1024 * 1024
    && 'createImageBitmap' in window
    && meta
  ) {
    try {
      result = await optimizeLargeJpeg(file, meta, maxEdge, quality);
    } catch {
      // Fall through to standard path
    }
  }

  if (!result) {
    result = await optimizeStandard(file, meta, maxEdge, quality);
  }

  const name = `${file.name.replace(/\.[^.]+$/, '') || 'order'}-optimized.jpg`;
  const optimizedFile = new File([result.blob], name, { type: ORDER_IMAGE_TYPE, lastModified: Date.now() });

  return {
    file: optimizedFile,
    optimized: true,
    originalSize: file.size,
    optimizedSize: optimizedFile.size,
    durationMs: Math.round(performance.now() - startedAt),
    width: result.width,
    height: result.height
  };
}
