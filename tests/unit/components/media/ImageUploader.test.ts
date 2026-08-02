import { mount } from "@vue/test-utils";
import ImageUploader from "@/components/media/ImageUploader.vue";

describe("ImageUploader", () => {
  it("uses the Phoenix single-file dropzone anatomy", () => {
    const wrapper = mount(ImageUploader);

    expect(wrapper.find(".dropzone.dropzone-single").exists()).toBe(true);
    expect(wrapper.find(".dz-message").exists()).toBe(true);
  });

  it("rejects unsupported image formats before creating a preview", async () => {
    const wrapper = mount(ImageUploader);
    const input = document.createElement("input");
    const file = new File(["gif"], "animation.gif", { type: "image/gif" });
    Object.defineProperty(input, "files", { value: [file] });

    (wrapper.vm as unknown as { selectFile: (event: Event) => void }).selectFile({ target: input } as unknown as Event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("select")).toBeUndefined();
    expect(wrapper.get('[role="alert"]').text()).toContain("JPG, PNG hoặc WEBP");
  });
});
