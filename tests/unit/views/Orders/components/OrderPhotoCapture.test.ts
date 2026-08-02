import { mount } from "@vue/test-utils";
import { vi } from "vitest";
import OrderPhotoCapture from "@/views/Orders/components/OrderPhotoCapture.vue";

describe("OrderPhotoCapture", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("emits a non-blocking warning with a low-resolution selected photo", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
      width: 960,
      height: 720,
      close,
    }));
    const wrapper = mount(OrderPhotoCapture, {
      props: { active: false },
      global: { stubs: { AppIcon: true } },
    });
    const file = new File(["image"], "order.jpg", { type: "image/jpeg" });
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, "files", {
      configurable: true,
      value: [file],
    });

    await input.trigger("change");

    expect(wrapper.emitted("captured")?.[0]).toEqual([
      file,
      "Ảnh hơi nhỏ, OCR có thể cần nhập thủ công. Bạn vẫn có thể tiếp tục ghi nhận đơn.",
    ]);
    expect(close).toHaveBeenCalledOnce();
  });
});
