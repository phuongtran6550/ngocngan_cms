import {
  MAX_IMAGE_BYTES,
  ORDER_PHOTO_IMAGE_OPTIMIZATION,
  calculateContainSize,
  parseExifOrientation,
  validateImageFile,
} from "@/utils/image-optimizer";

describe("image optimizer", () => {
  it("keeps the image within a 960 pixel edge without enlarging it", () => {
    expect(calculateContainSize(1920, 1080, 960)).toEqual({ width: 960, height: 540 });
    expect(calculateContainSize(480, 320, 960)).toEqual({ width: 480, height: 320 });
  });

  it("defines a higher-detail profile only for order photos", () => {
    expect(ORDER_PHOTO_IMAGE_OPTIMIZATION).toEqual({ maxEdge: 1600, jpegQuality: 0.84 });
    expect(calculateContainSize(3000, 2000, ORDER_PHOTO_IMAGE_OPTIMIZATION.maxEdge)).toEqual({
      width: 1600,
      height: 1067,
    });
  });

  it("rejects non-images and files larger than 25 MB", () => {
    expect(() => validateImageFile(new File(["text"], "note.txt", { type: "text/plain" }))).toThrow("JPG, PNG hoặc WEBP");
    expect(() => validateImageFile(new File(["gif"], "animation.gif", { type: "image/gif" }))).toThrow("JPG, PNG hoặc WEBP");
    expect(() => validateImageFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 } as File)).toThrow("25 MB");
  });

  it("reads EXIF orientation from a JPEG APP1 segment", () => {
    const bytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe1, 0x00, 0x1e,
      0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00,
      0x06, 0x00, 0x00, 0x00, 0xff, 0xd9,
    ]);

    expect(parseExifOrientation(bytes.buffer)).toBe(6);
  });
});
