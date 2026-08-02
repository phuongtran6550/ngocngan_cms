import {
  globalSearchTarget,
  searchQueryFromRoute,
} from "@/utils/global-search";

describe("global product search routing", () => {
  it("keeps list and detail searches inside the read-only Product module", () => {
    const permissions = ["warehouse.view"];

    expect(globalSearchTarget("/products", permissions)).toBe("/products");
    expect(globalSearchTarget("/products/sku-1", permissions)).toBe(
      "/products",
    );
    expect(searchQueryFromRoute("  NH-B925  ")).toBe("NH-B925");
  });
});
