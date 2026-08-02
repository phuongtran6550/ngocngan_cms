import { mount } from "@vue/test-utils";
import OrderForm from "@/views/Orders/components/OrderForm.vue";
import { emptyOrderForm } from "@/views/Orders/types";

describe("OrderForm", () => {
  const options = { categories: [{ id: "category-1", name: "Nhẫn", type: "category" as const }] };

  it("blocks save until the image draft exists", async () => {
    const wrapper = mount(OrderForm, {
      props: { modelValue: emptyOrderForm(), options, draftReady: false },
    });

    await wrapper.get("form").trigger("submit");

    expect(wrapper.get('[role="alert"]').text()).toContain("chụp hoặc chọn ảnh");
    expect(wrapper.emitted("submit")).toBeUndefined();
  });

  it("requires complete customer data for a full save", async () => {
    const wrapper = mount(OrderForm, {
      props: { modelValue: emptyOrderForm(), options, draftReady: true },
    });

    await wrapper.get("form").trigger("submit");
    expect(wrapper.get('[role="alert"]').text()).toContain("tên, số điện thoại và thành tiền");

    await wrapper.get('input[name="name"]').setValue("Nguyễn An");
    await wrapper.get('input[name="phone"]').setValue("0909000000");
    await wrapper.get('input[name="price"]').setValue("2500000");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")?.at(-1)?.[0]).toEqual(expect.objectContaining({
      name: "Nguyễn An",
      phone: "0909000000",
      price: 2_500_000,
    }));
  });

  it("allows a partial quick save after the draft image exists", async () => {
    const wrapper = mount(OrderForm, {
      props: { modelValue: emptyOrderForm(), options, draftReady: true, allowQuickSave: true },
    });

    await wrapper.get('button[aria-label="Lưu nhanh đơn nháp"]').trigger("click");

    expect(wrapper.emitted("quick-save")?.[0]?.[0]).toEqual(emptyOrderForm());
  });
});
