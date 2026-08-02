import { flushPromises, mount } from "@vue/test-utils";
import { vi } from "vitest";
import { silverPriceService } from "@/views/Settings/service";
import SilverPriceSection from "@/views/Settings/components/SilverPriceSection.vue";

describe("SilverPriceSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.classList.remove("modal-open");
    document.body.innerHTML = "";
  });

  function status() {
    return {
      silverPrice: 220000,
      weightedProductCount: 3,
      updatedAt: "2026-07-31T04:30:00.000Z",
      updatedBy: "user-1",
    };
  }

  it("renders the current price, affected count, and formula notice", async () => {
    vi.spyOn(silverPriceService, "status").mockResolvedValue(status());

    const wrapper = mount(SilverPriceSection, { attachTo: document.body });
    await flushPromises();

    expect(wrapper.text()).toContain("220.000 VNĐ / chỉ");
    expect(wrapper.text()).toContain("3 sản phẩm Đồ cân");
    expect(wrapper.text()).toContain("trọng lượng × giá bạc + tiền công + tiền xi");
    expect(wrapper.get('[data-testid="silver-price-input"]').attributes("inputmode")).toBe("numeric");
  });

  it("formats loaded and entered silver prices using VND separators", async () => {
    vi.spyOn(silverPriceService, "status").mockResolvedValue(status());

    const wrapper = mount(SilverPriceSection);
    await flushPromises();
    const input = wrapper.get('[data-testid="silver-price-input"]');

    expect((input.element as HTMLInputElement).value).toBe("220.000");
    await input.setValue("230000");
    expect((input.element as HTMLInputElement).value).toBe("230.000");
  });

  it("confirms and applies a changed value, then shows the updated count", async () => {
    vi.spyOn(silverPriceService, "status").mockResolvedValue(status());
    const apply = vi.spyOn(silverPriceService, "apply").mockResolvedValue({
      previousSilverPrice: 220000,
      silverPrice: 230000,
      updatedCount: 3,
      updatedAt: "2026-07-31T04:35:00.000Z",
      updatedBy: "user-2",
    });

    const wrapper = mount(SilverPriceSection, { attachTo: document.body });
    await flushPromises();
    await wrapper.get('[data-testid="silver-price-input"]').setValue("230000");
    await wrapper.get('[data-testid="silver-price-apply"]').trigger("click");

    expect(document.body.textContent).toContain("Xác nhận áp dụng giá bạc");
    expect(document.body.textContent).toContain("3 sản phẩm Đồ cân");
    const confirm = document.body.querySelector(".modal-footer .btn-danger");
    expect(confirm).not.toBeNull();
    await (confirm as HTMLButtonElement).click();
    await flushPromises();

    expect(apply).toHaveBeenCalledWith(230000);
    expect(wrapper.text()).toContain("Đã áp dụng giá bạc mới cho 3 sản phẩm Đồ cân");
    wrapper.unmount();
  });

  it("keeps the entered value and reports a safe error when apply fails", async () => {
    vi.spyOn(silverPriceService, "status").mockResolvedValue(status());
    vi.spyOn(silverPriceService, "apply").mockRejectedValue({ message: "Không thể áp dụng thay đổi giá bạc" });

    const wrapper = mount(SilverPriceSection, { attachTo: document.body });
    await flushPromises();
    const input = wrapper.get('[data-testid="silver-price-input"]');
    await input.setValue("230000");
    await wrapper.get('[data-testid="silver-price-apply"]').trigger("click");
    const confirm = document.body.querySelector(".modal-footer .btn-danger");
    expect(confirm).not.toBeNull();
    await (confirm as HTMLButtonElement).click();
    await flushPromises();

    expect((input.element as HTMLInputElement).value).toBe("230.000");
    expect(wrapper.get('[role="alert"]').text()).toContain("Không thể áp dụng thay đổi giá bạc");
    wrapper.unmount();
  });

  it("disables apply for an invalid or unchanged value", async () => {
    vi.spyOn(silverPriceService, "status").mockResolvedValue(status());

    const wrapper = mount(SilverPriceSection);
    await flushPromises();
    const button = wrapper.get('[data-testid="silver-price-apply"]');

    expect(button.attributes("disabled")).toBeDefined();
    await wrapper.get('[data-testid="silver-price-input"]').setValue("0");
    expect(button.attributes("disabled")).toBeDefined();
  });
});
