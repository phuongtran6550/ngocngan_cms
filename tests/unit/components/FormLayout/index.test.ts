import { mount } from "@vue/test-utils";
import FormLayout from "@/components/FormLayout/index.vue";
import type { FormDefinition } from "@/config/resource";

const definition: FormDefinition = {
  fields: [
    { key: "name", label: "Tên danh mục", type: "text", required: true },
  ],
};

describe("FormLayout", () => {
  it("emits only fields declared by the form definition", async () => {
    const wrapper = mount(FormLayout, {
      props: {
        definition,
        modelValue: { name: "Nhẫn", internal: "not-allowed" },
      },
    });

    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]?.[0]).toEqual({ name: "Nhẫn" });
  });

  it("updates a declared field without mutating the input model", async () => {
    const model = { name: "Nhẫn" };
    const wrapper = mount(FormLayout, { props: { definition, modelValue: model } });

    await wrapper.get('input[name="name"]').setValue("Vòng tay");

    expect(model.name).toBe("Nhẫn");
    expect(wrapper.emitted("update:modelValue")?.at(-1)?.[0]).toEqual({ name: "Vòng tay" });
  });

  it("shows an inline error and does not submit when a required field is empty", async () => {
    const wrapper = mount(FormLayout, {
      props: {
        definition,
        modelValue: { name: "   " },
      },
    });

    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")).toBeUndefined();
    expect(wrapper.get('[role="alert"]').text()).toBe("Tên danh mục là bắt buộc");
  });

  it("clears the inline required error after the user enters a value", async () => {
    const wrapper = mount(FormLayout, {
      props: {
        definition,
        modelValue: { name: "" },
      },
    });

    await wrapper.get("form").trigger("submit");
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);

    await wrapper.get('input[name="name"]').setValue("Vàng 18K");

    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("renders maxLength on text and textarea controls", () => {
    const wrapper = mount(FormLayout, {
      props: {
        definition: {
          fields: [
            { key: "name", label: "Tên", type: "text", maxLength: 120 },
            { key: "description", label: "Mô tả", type: "textarea", maxLength: 500 },
          ],
        },
        modelValue: { name: "", description: "" },
      },
    });

    expect(wrapper.get('input[name="name"]').attributes("maxlength")).toBe("120");
    expect(wrapper.get('textarea[name="description"]').attributes("maxlength")).toBe("500");
  });
});
