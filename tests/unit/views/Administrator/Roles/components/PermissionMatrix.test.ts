import { mount } from "@vue/test-utils";
import PermissionMatrix from "@/views/Administrator/Roles/components/PermissionMatrix.vue";

const catalog = {
  items: [
    { key: "orders.view", label: "Xem đơn hàng", group: "Đơn hàng" },
    { key: "orders.create", label: "Tạo đơn hàng", group: "Đơn hàng" },
    { key: "warehouse.view", label: "Xem hàng nhập", group: "Hàng nhập" },
  ],
  groups: [
    { name: "Đơn hàng", permissions: ["orders.view", "orders.create"] },
    { name: "Hàng nhập", permissions: ["warehouse.view"] },
  ],
};

describe("PermissionMatrix", () => {
  it("selects and clears a complete permission group", async () => {
    const wrapper = mount(PermissionMatrix, { props: { catalog, modelValue: [] } });

    await wrapper.get('[data-testid="permission-select-Đơn hàng"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([["orders.view", "orders.create"]]);

    await wrapper.setProps({ modelValue: ["orders.view", "orders.create"] });
    await wrapper.get('[data-testid="permission-clear-Đơn hàng"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[1]).toEqual([[]]);
  });

  it("filters permissions by label and key", async () => {
    const wrapper = mount(PermissionMatrix, { props: { catalog, modelValue: [] } });

    await wrapper.get('input[type="search"]').setValue("warehouse");

    expect(wrapper.text()).toContain("Xem hàng nhập");
    expect(wrapper.text()).not.toContain("Xem đơn hàng");
  });
});
