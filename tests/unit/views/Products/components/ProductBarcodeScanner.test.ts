import { DOMWrapper, flushPromises, mount } from "@vue/test-utils";
import { vi } from "vitest";
import ProductBarcodeScanner from "@/views/Products/components/ProductBarcodeScanner.vue";
import type { BarcodeCameraError } from "@/views/Products/scanner/useBarcodeCamera";
import type { ProductSku } from "@/views/Products/types";

interface ScannerCallbacks {
  onDetected(value: string): void;
  onUnsupported?(value: string): void;
  onInterrupted?(): void;
  onError(error: BarcodeCameraError): void;
}

const scanner = vi.hoisted(() => ({
  callbacks: null as ScannerCallbacks | null,
  active: { value: true },
  torchAvailable: { value: false },
  torchEnabled: { value: false },
  start: vi.fn(),
  stop: vi.fn(),
  scanFile: vi.fn(),
  toggleTorch: vi.fn(),
  preload: vi.fn(),
  byBarcode: vi.fn(),
}));

vi.mock("@/views/Products/scanner/useBarcodeCamera", () => ({
  useBarcodeCamera: (callbacks: ScannerCallbacks) => {
    scanner.callbacks = callbacks;
    return {
      active: scanner.active,
      torchAvailable: scanner.torchAvailable,
      torchEnabled: scanner.torchEnabled,
      start: scanner.start,
      stop: scanner.stop,
      scanFile: scanner.scanFile,
      toggleTorch: scanner.toggleTorch,
    };
  },
}));

vi.mock("@/views/Products/scanner/zxing-reader", () => ({
  preloadBarcodeReader: scanner.preload,
}));

vi.mock("@/views/Products/service", () => ({
  productService: { byBarcode: scanner.byBarcode },
}));

const sku: ProductSku = {
  id: "sku-1",
  productId: "warehouse-1",
  barcode: "10000000",
  skuCode: "NH-B925-BM-1C-N12",
  name: "Nhẫn Bông mai",
  thumbnail: "/uploads/product.jpg",
  images: [],
  categoryId: "category-1",
  category: "Nhẫn",
  materialId: "material-1",
  material: "Bạc 925",
  patternId: "pattern-1",
  pattern: "Bông mai",
  pricingType: "Đồ cân",
  size: "12",
  weight: 1.25,
  price: 850_000,
  stock: 2,
  laborCost: 150_000,
  platingCost: 20_000,
  importPrice: null,
  status: "active",
};

function mountScanner() {
  return mount(ProductBarcodeScanner, {
    attachTo: document.body,
    props: { open: true },
  });
}

function scannerText(): string {
  return document.body.textContent || "";
}

function scannerElement<T extends Element>(selector: string): T {
  const element = document.body.querySelector<T>(selector);
  if (!element) throw new Error(`Missing scanner element: ${selector}`);
  return element;
}

describe("ProductBarcodeScanner", () => {
  beforeEach(() => {
    scanner.callbacks = null;
    scanner.active.value = true;
    scanner.torchAvailable.value = false;
    scanner.torchEnabled.value = false;
    scanner.start.mockReset().mockResolvedValue(undefined);
    scanner.stop.mockReset();
    scanner.scanFile.mockReset();
    scanner.toggleTorch.mockReset();
    scanner.preload.mockReset().mockResolvedValue({});
    scanner.byBarcode.mockReset();
  });

  afterEach(() => {
    document.body.classList.remove("modal-open");
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("resolves one exact SKU after the live camera reports a stable barcode", async () => {
    scanner.byBarcode.mockResolvedValue(sku);
    const wrapper = mountScanner();
    await flushPromises();

    expect(scanner.start).toHaveBeenCalledOnce();
    expect(scannerText()).toContain("Đang quét");
    scanner.callbacks?.onDetected("10000000");
    await flushPromises();

    expect(scanner.byBarcode).toHaveBeenCalledWith(
      "10000000",
      expect.any(AbortSignal),
    );
    expect(wrapper.emitted("resolved")?.[0]).toEqual([sku]);
    wrapper.unmount();
  });

  it("supports lookup retry without reopening the camera", async () => {
    scanner.byBarcode
      .mockRejectedValueOnce({ code: "NETWORK_ERROR", message: "Mất kết nối" })
      .mockResolvedValueOnce(sku);
    const wrapper = mountScanner();
    await flushPromises();

    scanner.callbacks?.onDetected("10000000");
    await flushPromises();
    expect(scannerText()).toContain("Mất kết nối");

    await new DOMWrapper(
      scannerElement<HTMLButtonElement>(".scanner-actions .btn-primary"),
    ).trigger("click");
    await flushPromises();

    expect(scanner.start).toHaveBeenCalledTimes(1);
    expect(scanner.byBarcode).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted("resolved")?.[0]).toEqual([sku]);
    wrapper.unmount();
  });

  it("offers rescan for invalid results but not a pointless retry for duplicate data", async () => {
    scanner.byBarcode.mockRejectedValueOnce({
      code: "INVALID_INVENTORY_BARCODE",
      message: "invalid",
    });
    const invalid = mountScanner();
    await flushPromises();
    scanner.callbacks?.onDetected("10000000");
    await flushPromises();

    expect(scannerText()).toContain("Quét lại");
    expect(scannerText()).not.toContain("Thử tìm lại");
    invalid.unmount();

    scanner.byBarcode.mockRejectedValueOnce({
      code: "DUPLICATE_INVENTORY_BARCODE",
      message: "duplicate",
    });
    const duplicate = mountScanner();
    await flushPromises();
    scanner.callbacks?.onDetected("10000000");
    await flushPromises();

    expect(scannerText()).toContain("liên hệ quản trị viên");
    expect(scannerText()).not.toContain("Thử tìm lại");
    duplicate.unmount();
  });

  it("decodes selected files locally and ignores lookup completion after close", async () => {
    scanner.scanFile.mockResolvedValue("10000000");
    let resolveLookup!: (value: ProductSku) => void;
    scanner.byBarcode.mockReturnValue(
      new Promise<ProductSku>((resolve) => {
        resolveLookup = resolve;
      }),
    );
    const wrapper = mountScanner();
    await flushPromises();
    const input = new DOMWrapper(
      scannerElement<HTMLInputElement>('input[type="file"]'),
    );
    const file = new File(["label"], "label.jpg", { type: "image/jpeg" });
    Object.defineProperty(input.element, "files", {
      configurable: true,
      value: [file],
    });

    expect(input.attributes("capture")).toBeUndefined();
    await input.trigger("change");
    await flushPromises();
    expect(scanner.scanFile).toHaveBeenCalledWith(file);

    await wrapper.setProps({ open: false });
    resolveLookup(sku);
    await flushPromises();

    expect(wrapper.emitted("resolved")).toBeUndefined();
    expect(scanner.stop).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("does not let an old file decode overwrite a newly opened camera session", async () => {
    let resolveFile!: (value: string | null) => void;
    scanner.scanFile.mockReturnValue(
      new Promise<string | null>((resolve) => {
        resolveFile = resolve;
      }),
    );
    const wrapper = mountScanner();
    await flushPromises();
    const input = new DOMWrapper(
      scannerElement<HTMLInputElement>('input[type="file"]'),
    );
    Object.defineProperty(input.element, "files", {
      configurable: true,
      value: [new File(["old"], "old.jpg")],
    });
    await input.trigger("change");
    await flushPromises();

    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    await flushPromises();
    resolveFile(null);
    await flushPromises();

    expect(scannerText()).toContain("Đang quét");
    expect(scannerText()).not.toContain("Không đọc được barcode rõ ràng");
    wrapper.unmount();
  });

  it("does not let an old preload failure stop a newly opened camera session", async () => {
    let rejectOldPreload!: (error: Error) => void;
    scanner.preload
      .mockReturnValueOnce(
        new Promise((_, reject) => {
          rejectOldPreload = reject;
        }),
      )
      .mockResolvedValueOnce({});
    const wrapper = mountScanner();
    await flushPromises();

    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    await flushPromises();
    expect(scannerText()).toContain("Đang quét");

    rejectOldPreload(new Error("old preload failed"));
    await flushPromises();

    expect(scannerText()).toContain("Đang quét");
    expect(scannerText()).not.toContain("Không thể tải bộ đọc barcode");
    wrapper.unmount();
  });

  it("aborts an exact lookup when page lifecycle interrupts the scanner", async () => {
    let resolveLookup!: (value: ProductSku) => void;
    scanner.byBarcode.mockReturnValue(
      new Promise<ProductSku>((resolve) => {
        resolveLookup = resolve;
      }),
    );
    const wrapper = mountScanner();
    await flushPromises();
    scanner.callbacks?.onDetected("10000000");
    await flushPromises();
    const signal = scanner.byBarcode.mock.calls[0][1] as AbortSignal;

    scanner.callbacks?.onInterrupted?.();
    resolveLookup(sku);
    await flushPromises();

    expect(signal.aborted).toBe(true);
    expect(scannerText()).toContain("Phiên quét đã tạm dừng");
    expect(wrapper.emitted("resolved")).toBeUndefined();
    wrapper.unmount();
  });
});
