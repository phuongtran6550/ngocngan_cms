import { mount } from "@vue/test-utils";
import DataTable from "@/components/Table/DataTable.vue";
import type { ColumnDefinition, ResourceRow } from "@/config/resource";

const columns: ColumnDefinition[] = [
  { key: "price", label: "Giá", type: "money" },
  { key: "stock", label: "Tồn", type: "number" },
  { key: "updatedAt", label: "Cập nhật", type: "datetime" },
  {
    key: "pricingType",
    label: "Định giá",
    type: "select",
    options: [{ value: "weight", label: "Đồ cân" }],
  },
  { key: "note", label: "Ghi chú", type: "text" },
];

const rows: ResourceRow[] = [
  {
    id: "inventory-1",
    price: 1_250_000,
    stock: 12_345,
    updatedAt: "2026-07-26T07:30:00.000Z",
    pricingType: "weight",
    note: "",
  },
];

describe("DataTable", () => {
  it("renders only columns configured for DataTable", () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [
          { key: "shared", label: "Dùng chung", type: "text" },
          {
            key: "tableOnly",
            label: "Chỉ bảng",
            type: "text",
            displayIn: "table",
          },
          {
            key: "cardOnly",
            label: "Chỉ thẻ",
            type: "text",
            displayIn: "card",
          },
        ],
        rows: [
          {
            id: "row-1",
            shared: "Giá trị chung",
            tableOnly: "Giá trị bảng",
            cardOnly: "Giá trị thẻ",
          },
        ],
      },
    });

    expect(wrapper.text()).toContain("Dùng chung");
    expect(wrapper.text()).toContain("Giá trị chung");
    expect(wrapper.text()).toContain("Chỉ bảng");
    expect(wrapper.text()).toContain("Giá trị bảng");
    expect(wrapper.text()).not.toContain("Chỉ thẻ");
    expect(wrapper.text()).not.toContain("Giá trị thẻ");
  });

  it("formats resource values consistently", () => {
    const wrapper = mount(DataTable, { props: { columns, rows } });
    const text = wrapper.text();

    expect(text).toContain("1.250.000 ₫");
    expect(text).toContain("12.345");
    expect(text).toContain("Đồ cân");
    expect(text).toContain("—");
    expect(text).toContain(
      new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(rows[0].updatedAt as string)),
    );
  });

  it("renders image columns as thumbnails instead of raw URLs", () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: "thumbnail", label: "Ảnh", type: "image" }],
        rows: [{ id: "order-1", thumbnail: "/uploads/order.jpg" }],
      },
    });

    expect(wrapper.get('img[alt="Ảnh order-1"]').attributes("src")).toContain(
      "/uploads/order.jpg",
    );
    expect(wrapper.text()).not.toContain("/uploads/order.jpg");
  });

  it("keeps dense declarative tables scrollable inside Phoenix's native responsive viewport", () => {
    const wrapper = mount(DataTable, {
      props: { columns, rows, minTableWidth: "70rem" },
    });

    expect(wrapper.get("table").attributes("style")).toContain(
      "min-width: 70rem",
    );
  });

  it("groups permitted row actions in a Phoenix reveal menu", async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: "name", label: "Tên", type: "text" }],
        rows: [
          { id: "system", name: "Quản trị viên", isSystem: true },
          { id: "custom", name: "Bán hàng", isSystem: false },
        ],
        allowUpdate: true,
        allowDelete: true,
        canUpdateRow: (row: ResourceRow) => !row.isSystem,
        canDeleteRow: (row: ResourceRow) => !row.isSystem,
      },
    });

    expect(wrapper.findAll('[data-testid="row-action-menu"]')).toHaveLength(1);
    expect(wrapper.get("tbody td:last-child").classes()).not.toContain(
      "position-sticky",
    );

    await wrapper.get('[data-testid="row-action-toggle"]').trigger("click");
    expect(wrapper.findAll('[data-testid="row-action-edit"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="row-action-delete"]')).toHaveLength(
      1,
    );
  });
});
