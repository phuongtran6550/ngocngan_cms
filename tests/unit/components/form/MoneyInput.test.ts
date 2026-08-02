import { mount } from "@vue/test-utils";
import MoneyInput from "@/components/Form/MoneyInput.vue";

describe("MoneyInput", () => {
  it("formats the displayed value with comma thousands separators", () => {
    const wrapper = mount(MoneyInput, {
      props: {
        id: "money",
        name: "money",
        modelValue: 1_000,
      },
    });

    expect(wrapper.get<HTMLInputElement>("input").element.value).toBe("1,000");
  });

  it("emits a numeric value while formatting user input", async () => {
    const wrapper = mount(MoneyInput, {
      props: {
        id: "money",
        name: "money",
        modelValue: null,
      },
    });
    const input = wrapper.get<HTMLInputElement>("input");

    await input.setValue("1234567");

    expect(input.element.value).toBe("1,234,567");
    expect(wrapper.emitted("update:modelValue")).toEqual([[1_234_567]]);
  });

  it("emits null when the input is cleared", async () => {
    const wrapper = mount(MoneyInput, {
      props: {
        id: "money",
        name: "money",
        modelValue: 1_000,
      },
    });
    const input = wrapper.get<HTMLInputElement>("input");

    await input.setValue("");

    expect(input.element.value).toBe("");
    expect(wrapper.emitted("update:modelValue")).toEqual([[null]]);
  });
});
