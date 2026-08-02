import { vi } from "vitest";

const zxing = vi.hoisted(() => ({
  prepare: vi.fn(),
  purge: vi.fn(),
  read: vi.fn(),
}));

vi.mock("zxing-wasm/reader", () => ({
  prepareZXingModule: zxing.prepare,
  purgeZXingModule: zxing.purge,
  readBarcodes: zxing.read,
}));

vi.mock("zxing-wasm/reader/zxing_reader.wasm?url", () => ({
  default: "/assets/zxing_reader.wasm",
}));

describe("zxing reader preload", () => {
  beforeEach(() => {
    vi.resetModules();
    zxing.prepare.mockReset();
    zxing.purge.mockReset();
    zxing.read.mockReset();
  });

  it("keeps the WASM self-hosted and permits retry after a transient preload failure", async () => {
    zxing.prepare
      .mockReturnValueOnce(undefined)
      .mockRejectedValueOnce(new Error("temporary load failure"))
      .mockReturnValueOnce(undefined)
      .mockResolvedValueOnce({});
    const reader = await import("@/views/Products/scanner/zxing-reader");

    await expect(reader.preloadBarcodeReader()).rejects.toThrow(
      "temporary load failure",
    );
    await expect(reader.preloadBarcodeReader()).resolves.toEqual({});

    expect(zxing.prepare).toHaveBeenNthCalledWith(1, {
      overrides: { locateFile: expect.any(Function) },
    });
    expect(zxing.prepare).toHaveBeenNthCalledWith(2, {
      overrides: { locateFile: expect.any(Function) },
      fireImmediately: true,
    });
    expect(zxing.purge).toHaveBeenCalledOnce();
    expect(zxing.prepare).toHaveBeenNthCalledWith(3, {
      overrides: { locateFile: expect.any(Function) },
    });
    expect(zxing.prepare).toHaveBeenNthCalledWith(4, {
      overrides: { locateFile: expect.any(Function) },
      fireImmediately: true,
    });
    const locateFile = zxing.prepare.mock.calls[0][0].overrides.locateFile;
    expect(locateFile("zxing_reader.wasm", "https://cdn.invalid/")).toBe(
      "/assets/zxing_reader.wasm",
    );
    expect(zxing.prepare).toHaveBeenCalledTimes(4);
  });

  it("restores the self-hosted override after a decode failure", async () => {
    zxing.prepare.mockReturnValue(undefined);
    zxing.read
      .mockRejectedValueOnce(new Error("decoder failed"))
      .mockResolvedValueOnce([]);
    const reader = await import("@/views/Products/scanner/zxing-reader");
    const image = new Blob(["label"], { type: "image/jpeg" });

    await expect(reader.readBarcodeValues(image, "fast")).rejects.toThrow(
      "decoder failed",
    );
    await expect(reader.readBarcodeValues(image, "fast")).resolves.toEqual([]);

    expect(zxing.purge).toHaveBeenCalledOnce();
    expect(zxing.prepare).toHaveBeenCalledTimes(2);
    for (const [options] of zxing.prepare.mock.calls) {
      expect(options).toEqual({
        overrides: { locateFile: expect.any(Function) },
      });
    }
  });
});
