import { mount } from "@vue/test-utils";
import BrandLogo from "@/components/app/BrandLogo.vue";

describe("BrandLogo", () => {
  it("renders the requested official logo asset with an accessible brand name", () => {
    const wrapper = mount(BrandLogo, {
      props: { kind: "lockup", tone: "white" },
    });

    expect(wrapper.get('[data-testid="brand-logo"]').attributes("src")).toBe(
      "/brand/ngoc-chau-lockup-white.png",
    );
    expect(wrapper.get("img").attributes("alt")).toBe("Ngọc Châu");
  });

  it("can render the shared wordmark text next to a compact mark", () => {
    const wrapper = mount(BrandLogo, {
      props: { kind: "mark", showName: true },
    });

    expect(wrapper.get(".logo-text").text()).toBe("Ngọc Châu");
  });

  it("can retain Phoenix's compact header wordmark behavior on phones", () => {
    const wrapper = mount(BrandLogo, {
      props: { kind: "mark", showName: true, hideNameOnMobile: true },
    });

    expect(wrapper.get(".logo-text").classes()).toEqual(
      expect.arrayContaining(["d-none", "d-sm-block"]),
    );
  });
});
