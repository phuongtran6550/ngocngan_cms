import { mount } from "@vue/test-utils";
import RowActionMenu from "@/components/Table/RowActionMenu.vue";

describe("RowActionMenu", () => {
  it("keeps secondary row actions behind Phoenix's reveal control", async () => {
    const wrapper = mount(RowActionMenu, {
      props: {
        canView: true,
        canEdit: true,
        canDelete: true,
        resourceLabel: "Nhẫn",
      },
    });

    expect(wrapper.find('[data-testid="row-action-menu"]').exists()).toBe(true);
    expect(
      wrapper.get('[data-testid="row-action-menu"]').classes(),
    ).not.toContain("cms-row-action-menu");
    expect(wrapper.find('[data-testid="row-action-edit"]').exists()).toBe(
      false,
    );

    await wrapper.get('[data-testid="row-action-toggle"]').trigger("click");
    expect(wrapper.get('[data-testid="row-action-edit"]').text()).toContain(
      "Sửa",
    );

    await wrapper.get('[data-testid="row-action-delete"]').trigger("click");
    expect(wrapper.emitted("delete")).toHaveLength(1);
  });

  it("does not render a reveal control when no action is permitted", () => {
    const wrapper = mount(RowActionMenu, {
      props: { resourceLabel: "Nhẫn" },
    });

    expect(wrapper.find('[data-testid="row-action-menu"]').exists()).toBe(
      false,
    );
  });

  it("closes the Phoenix action menu with Escape", async () => {
    const wrapper = mount(RowActionMenu, {
      attachTo: document.body,
      props: { canView: true, resourceLabel: "Nhẫn" },
    });

    await wrapper.get('[data-testid="row-action-toggle"]').trigger("click");
    expect(wrapper.find('[role="menu"]').exists()).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    expect(
      wrapper
        .get('[data-testid="row-action-toggle"]')
        .attributes("aria-expanded"),
    ).toBe("false");
  });
});
