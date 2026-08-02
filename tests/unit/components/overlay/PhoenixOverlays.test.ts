import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createPinia } from "pinia";
import MobileNavDrawer from "@/components/app/MobileNavDrawer.vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import ImagePreview from "@/components/media/ImagePreview.vue";

afterEach(() => {
  document.body.classList.remove("modal-open");
  document.body.innerHTML = "";
});

describe("Phoenix overlays", () => {
  it("renders shared drawers with native Phoenix offcanvas anatomy", () => {
    const wrapper = mount(DrawerPanel, {
      attachTo: document.body,
      props: { open: true, title: "Chỉnh sửa danh mục" },
      slots: { default: "Nội dung" },
    });

    expect(document.body.querySelector(".offcanvas.offcanvas-end.show")).not.toBeNull();
    expect(document.body.querySelector(".offcanvas-header")).not.toBeNull();
    expect(document.body.querySelector(".offcanvas-body")).not.toBeNull();

    wrapper.unmount();
  });

  it("renders confirmation with Bootstrap modal and backdrop layers", () => {
    const wrapper = mount(ConfirmDialog, {
      attachTo: document.body,
      props: { open: true },
    });

    expect(document.body.querySelector(".modal.fade.show")).not.toBeNull();
    expect(document.body.querySelector(".modal-backdrop.fade.show")).not.toBeNull();

    wrapper.unmount();
  });

  it("renders image inspection in the same Phoenix modal system", () => {
    const wrapper = mount(ImagePreview, {
      attachTo: document.body,
      props: { src: "/preview.jpg" },
    });

    expect(document.body.querySelector(".modal.fade.show .modal-dialog")).not.toBeNull();
    expect(document.body.querySelector(".modal-backdrop.fade.show")).not.toBeNull();

    wrapper.unmount();
  });

  it.each([
    ["drawer", DrawerPanel, { open: true, title: "Chỉnh sửa" }, "close"],
    ["confirmation", ConfirmDialog, { open: true }, "cancel"],
    ["image preview", ImagePreview, { src: "/preview.jpg" }, "close"],
  ])("matches Phoenix dismissal behavior for %s", async (_name, component, props, event) => {
    const wrapper = mount(component, { attachTo: document.body, props });

    expect(document.body.classList.contains("modal-open")).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();

    expect(wrapper.emitted(event)).toHaveLength(1);
    wrapper.unmount();
  });

  it("uses the same native dismissal behavior for the mobile navigation", async () => {
    const wrapper = mount(MobileNavDrawer, {
      attachTo: document.body,
      props: { open: true },
      global: {
        plugins: [createPinia()],
        stubs: { RouterLink: { template: "<a><slot /></a>" } },
      },
    });

    expect(document.body.classList.contains("modal-open")).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();

    expect(wrapper.emitted("close")).toHaveLength(1);
    wrapper.unmount();
  });
});
