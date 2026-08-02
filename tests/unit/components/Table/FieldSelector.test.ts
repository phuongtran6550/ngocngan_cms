import { mount } from "@vue/test-utils";
import FieldSelector from "@/components/Table/FieldSelector.vue";

describe("FieldSelector", () => {
  it("uses Phoenix dropdown anatomy for selecting displayed columns", async () => {
    const wrapper = mount(FieldSelector, {
      props: {
        columns: [{ key: "name", label: "Tên", type: "text" }],
        selected: ["name"],
      },
    });

    expect(
      wrapper.find(".dropdown > button.btn.btn-phoenix-secondary").exists(),
    ).toBe(true);

    await wrapper.get('[data-testid="field-selector-toggle"]').trigger("click");

    expect(wrapper.find(".dropdown-menu.show").exists()).toBe(true);
  });

  it("closes the column dropdown with Escape", async () => {
    const wrapper = mount(FieldSelector, {
      attachTo: document.body,
      props: {
        columns: [{ key: "name", label: "Tên", type: "text" }],
        selected: ["name"],
      },
    });

    await wrapper.get('[data-testid="field-selector-toggle"]').trigger("click");
    expect(wrapper.find(".dropdown-menu.show").exists()).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".dropdown-menu.show").exists()).toBe(false);
    expect(
      wrapper
        .get('[data-testid="field-selector-toggle"]')
        .attributes("aria-expanded"),
    ).toBe("false");
  });
});
