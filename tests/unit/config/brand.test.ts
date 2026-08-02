import { brand, brandAsset, brandPageTitle } from "@/config/brand";

describe("Ngoc Chau brand configuration", () => {
  it("exposes official public logo assets from one source of truth", () => {
    expect(brand.name).toBe("Ngọc Châu");
    expect(brandAsset("mark", "gold")).toBe("/brand/ngoc-chau-mark-gold.png");
    expect(brandAsset("lockup", "white")).toBe("/brand/ngoc-chau-lockup-white.png");
    expect(brand.favicon).toBe("/brand/favicon.ico");
  });

  it("builds consistent browser titles", () => {
    expect(brandPageTitle("Đăng nhập")).toBe("Đăng nhập · Ngọc Châu CMS");
    expect(brandPageTitle()).toBe("Ngọc Châu CMS");
  });
});
