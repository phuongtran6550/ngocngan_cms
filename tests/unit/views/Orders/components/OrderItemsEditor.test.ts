import { mount } from "@vue/test-utils";
import OrderItemsEditor from "@/views/Orders/components/OrderItemsEditor.vue";

describe("OrderItemsEditor", () => {
  const categories = [
    { id: "category-1", name: "Nhẫn", type: "category" as const },
    { id: "category-2", name: "Vòng tay", type: "category" as const },
  ];

  it("adds a product row using API-provided category options", async () => {
    const wrapper = mount(OrderItemsEditor, {
      props: { modelValue: [], categories },
    });

    await wrapper.get('button[aria-label="Thêm sản phẩm"]').trigger("click");
    await wrapper.get("select").setValue("category-2");
    await wrapper.get('input[type="number"]').setValue("1500000");

    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toEqual([
      expect.objectContaining({ categoryId: "category-2", category: "Vòng tay", price: 1_500_000 }),
    ]);
  });

  it("removes a product row without mutating the input", async () => {
    const items = [{ id: "line-1", categoryId: "category-1", category: "Nhẫn", price: 900_000 }];
    const wrapper = mount(OrderItemsEditor, {
      props: { modelValue: items, categories },
    });

    await wrapper.get('button[aria-label="Xóa Nhẫn"]').trigger("click");

    expect(items).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toEqual([]);
  });
});
