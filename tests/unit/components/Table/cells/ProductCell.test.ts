import { mount } from "@vue/test-utils";
import ProductCell from "@/components/Table/cells/ProductCell.vue";

describe("ProductCell", () => {
  it("renders warehouse product identity with a square image and SKU count", () => {
    const wrapper = mount(ProductCell, {
      props: {
        row: {
          id: "product-1",
          name: "Nhẫn Aurora",
          code: "NH-V18K-TR",
          thumbnail: "/uploads/aurora.jpg",
          skus: [{ id: "sku-1" }, { id: "sku-2" }],
        },
        column: { key: "name", label: "Sản phẩm", type: "product" },
      },
    });

    expect(wrapper.get("img").attributes()).toMatchObject({
      width: "53",
      height: "53",
    });
    expect(wrapper.text()).toContain("Nhẫn Aurora");
    expect(wrapper.text()).toContain("2 phiên bản (SKU)");
  });

  it("keeps product identity readable when no image is available", () => {
    const wrapper = mount(ProductCell, {
      props: {
        row: { id: "product-1", name: "Nhẫn Aurora", code: "NH-001" },
        column: { key: "name", label: "Sản phẩm", type: "product" },
      },
    });

    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.text()).toContain("Nhẫn Aurora");
    expect(wrapper.text()).toContain("0 phiên bản (SKU)");
  });

  it("renders the exact SKU code for Product catalog rows", () => {
    const wrapper = mount(ProductCell, {
      props: {
        row: {
          id: "sku-1",
          name: "Nhẫn Aurora",
          skuCode: "NH-V18K-TR-N12",
        },
        column: { key: "name", label: "Sản phẩm", type: "product" },
      },
    });

    expect(wrapper.text()).toContain("SKU: NH-V18K-TR-N12");
  });

  it("keeps an empty legacy Product SKU distinct from a warehouse SKU count", () => {
    const wrapper = mount(ProductCell, {
      props: {
        row: {
          id: "sku-legacy",
          name: "Nhẫn chưa có mã",
          skuCode: "",
        },
        column: { key: "name", label: "Sản phẩm", type: "product" },
      },
    });

    expect(wrapper.text()).toContain("SKU: —");
    expect(wrapper.text()).not.toContain("phiên bản");
  });
});
