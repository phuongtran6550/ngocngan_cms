import { mount } from "@vue/test-utils";
import EmptyState from "@/components/placeholder/EmptyState.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";

describe("Phoenix state primitives", () => {
  it("renders an empty state without repurposing the avatar fallback", () => {
    const wrapper = mount(EmptyState);

    expect(wrapper.classes()).toEqual(expect.arrayContaining(["text-center", "py-6"]));
    expect(wrapper.find(".avatar").exists()).toBe(false);
    expect(wrapper.find("svg").exists()).toBe(true);
    expect(wrapper.classes()).not.toContain("cms-empty-state");
  });

  it("uses Phoenix placeholder utilities without a parallel loading wrapper", () => {
    const wrapper = mount(LoadingSkeleton, { props: { rows: 2 } });

    expect(wrapper.classes()).not.toContain("cms-loading-skeleton");
    expect(wrapper.findAll(".placeholder-glow")).toHaveLength(2);
  });
});
