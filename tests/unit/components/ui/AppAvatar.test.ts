import { mount } from "@vue/test-utils";
import AppAvatar from "@/components/ui/AppAvatar.vue";

describe("AppAvatar", () => {
  it("renders a neutral user silhouette when no avatar image is available", () => {
    const wrapper = mount(AppAvatar, { props: { size: "xl" } });

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(["avatar", "avatar-xl"]),
    );
    expect(wrapper.find("img").exists()).toBe(false);
    expect(
      wrapper.get('[data-testid="default-avatar"]').attributes("viewBox"),
    ).toBe("0 0 48 48");
  });

  it("uses the same default silhouette when an avatar image cannot load", async () => {
    const wrapper = mount(AppAvatar, {
      props: { src: "/uploads/missing-avatar.webp" },
    });

    await wrapper.get("img.rounded-circle").trigger("error");

    expect(wrapper.find("img.rounded-circle").exists()).toBe(false);
    expect(wrapper.find('[data-testid="default-avatar"]').exists()).toBe(true);
  });
});
