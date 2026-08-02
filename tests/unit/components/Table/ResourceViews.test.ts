import { mount } from "@vue/test-utils";
import DataTable from "@/components/Table/DataTable.vue";

const columns = [{ key: "name", label: "Tên", type: "text" as const }];
const rows = [{ id: "item-1", name: "Nhẫn" }];

describe("resource view actions", () => {
  it("emits a named view action from the shared Phoenix table", async () => {
    const wrapper = mount(DataTable, { props: { columns, rows, allowView: true } });

    await wrapper.get('[data-testid="row-action-toggle"]').trigger("click");
    await wrapper.get('[data-testid="row-action-view"]').trigger("click");

    expect(wrapper.emitted("view")?.[0]?.[0]).toEqual(rows[0]);
  });
});
