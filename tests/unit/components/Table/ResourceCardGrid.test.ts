import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ResourceCardGrid from "@/components/Table/ResourceCardGrid.vue";
import type { ColumnDefinition, ResourceRow } from "@/config/resource";

describe("ResourceCardGrid", () => {
  it("renders only columns configured for Card Grid", () => {
    const wrapper = mount(ResourceCardGrid, {
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
    expect(wrapper.text()).toContain("Chỉ thẻ");
    expect(wrapper.text()).toContain("Giá trị thẻ");
    expect(wrapper.text()).not.toContain("Chỉ bảng");
    expect(wrapper.text()).not.toContain("Giá trị bảng");
  });

  it("chooses the card title after filtering out table-only columns", () => {
    const wrapper = mount(ResourceCardGrid, {
      props: {
        columns: [
          {
            key: "tableName",
            label: "Tên bảng",
            type: "text",
            displayIn: "table",
          },
          {
            key: "cardName",
            label: "Tên thẻ",
            type: "text",
            displayIn: "card",
          },
        ],
        rows: [{ id: "row-1", tableName: "Bảng", cardName: "Thẻ" }],
      },
    });

    expect(wrapper.get('[data-testid="resource-card-title"]').text()).toContain(
      "Thẻ",
    );
    expect(
      wrapper.get('[data-testid="resource-card-title"]').text(),
    ).not.toContain("Bảng");
  });

  it("renders hierarchical cards with shared cell formatting", () => {
    const columns: ColumnDefinition[] = [
      { key: "name", label: "Tên", type: "text" },
      { key: "status", label: "Trạng thái", type: "status" },
      { key: "price", label: "Giá", type: "money" },
      { key: "position", label: "STT", type: "stt" },
      { key: "hidden", label: "Ẩn", type: "text", visible: false },
    ];
    const rows: ResourceRow[] = [
      {
        id: "1",
        name: "Nhẫn cưới",
        status: "active",
        price: 1_250_000,
        hidden: "Không hiển thị",
      },
    ];

    const wrapper = mount(ResourceCardGrid, { props: { columns, rows } });
    const card = wrapper.get('[data-testid="resource-card"]');

    expect(
      wrapper.get('[data-testid="resource-card-grid"]').classes(),
    ).toContain("row-cols-xl-3");
    expect(card.text()).toContain("Nhẫn cưới");
    expect(card.text()).toContain("Trạng thái");
    expect(card.text()).toContain("Đang hoạt động");
    expect(card.text()).toContain("Giá");
    expect(card.text()).toContain("1.250.000 ₫");
    expect(card.text()).not.toContain("STT");
    expect(card.text()).not.toContain("Không hiển thị");
    expect(card.attributes("aria-labelledby")).toBe(
      wrapper.get('[data-testid="resource-card-title"]').attributes("id"),
    );
  });

  it("emits cell and row actions with the existing payloads", async () => {
    const row: ResourceRow = {
      id: "custom",
      name: "Bán hàng",
      command: "open",
    };
    const columns: ColumnDefinition[] = [
      { key: "name", label: "Tên", type: "text" },
      {
        key: "command",
        label: "Lệnh",
        type: "action",
        actions: [{ key: "open", label: "Mở" }],
      },
    ];
    const wrapper = mount(ResourceCardGrid, {
      props: { columns, rows: [row], allowView: true },
    });

    await wrapper.get('button[aria-label="Mở"]').trigger("click");
    await wrapper.get('[data-testid="row-action-toggle"]').trigger("click");
    await wrapper.get('[data-testid="row-action-view"]').trigger("click");

    expect(wrapper.emitted("cell-action")?.[0]?.[0]).toMatchObject({
      row,
      column: columns[1],
      action: { type: "action", value: { key: "open", row } },
    });
    expect(wrapper.emitted("view")?.[0]?.[0]).toEqual(row);
  });

  it("keeps status in the header instead of using it as the card title", () => {
    const wrapper = mount(ResourceCardGrid, {
      props: {
        columns: [
          { key: "status", label: "Trạng thái", type: "status" },
          { key: "name", label: "Tên", type: "text" },
        ],
        rows: [{ id: "1", status: "active", name: "Nhẫn cưới" }],
      },
    });

    expect(wrapper.get('[data-testid="resource-card-title"]').text()).toContain(
      "Nhẫn cưới",
    );
  });

  it("prefers a readable field over an image for the card title", () => {
    const wrapper = mount(ResourceCardGrid, {
      props: {
        columns: [
          { key: "thumbnail", label: "Ảnh", type: "image" },
          { key: "name", label: "Khách hàng", type: "text" },
        ],
        rows: [
          {
            id: "order-1",
            thumbnail: "/uploads/order.jpg",
            name: "Nguyễn Minh Anh",
          },
        ],
      },
    });

    expect(wrapper.get('[data-testid="resource-card-title"]').text()).toContain(
      "Nguyễn Minh Anh",
    );
  });

  it("hides update and delete menus for rows without permission", () => {
    const rows: ResourceRow[] = [
      { id: "system", name: "Quản trị viên", isSystem: true },
      { id: "custom", name: "Bán hàng", isSystem: false },
    ];
    const wrapper = mount(ResourceCardGrid, {
      props: {
        columns: [{ key: "name", label: "Tên", type: "text" }],
        rows,
        allowUpdate: true,
        allowDelete: true,
        canUpdateRow: (row: ResourceRow) => !row.isSystem,
        canDeleteRow: (row: ResourceRow) => !row.isSystem,
      },
    });

    expect(wrapper.findAll('[data-testid="row-action-menu"]')).toHaveLength(1);
  });
});
