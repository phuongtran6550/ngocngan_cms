import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ChangePasswordDrawer from "@/views/Account/components/ChangePasswordDrawer.vue";
import { authenStore } from "@/stores/app-authen";

function mountDrawer() {
  setActivePinia(createPinia());
  const wrapper = mount(ChangePasswordDrawer, {
    attachTo: document.body,
    props: { open: true },
    global: {
      stubs: {
        DrawerPanel: { props: ["open", "title"], template: '<section v-if="open" data-testid="change-password-drawer"><slot /></section>' },
      },
    },
  });
  return { wrapper, auth: authenStore() };
}

describe("ChangePasswordDrawer", () => {
  it("validates confirmation before submitting", async () => {
    const { wrapper, auth } = mountDrawer();
    const changePassword = vi.spyOn(auth, "changePassword").mockResolvedValue();

    await wrapper.get('[data-testid="change-password-new"]').setValue("secret1");
    await wrapper.get('[data-testid="change-password-confirm"]').setValue("secret2");
    await wrapper.get('[data-testid="change-password-form"]').trigger("submit");

    expect(changePassword).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Mật khẩu xác nhận không khớp");
  });

  it("submits the password, resets the form, and emits changed", async () => {
    const { wrapper, auth } = mountDrawer();
    const changePassword = vi.spyOn(auth, "changePassword").mockResolvedValue();

    await wrapper.get('[data-testid="change-password-new"]').setValue("secret1");
    await wrapper.get('[data-testid="change-password-confirm"]').setValue("secret1");
    await wrapper.get('[data-testid="change-password-form"]').trigger("submit");
    await flushPromises();

    expect(changePassword).toHaveBeenCalledWith("secret1");
    expect(wrapper.emitted("changed")).toHaveLength(1);
    expect(wrapper.get<HTMLInputElement>('[data-testid="change-password-new"]').element.value).toBe("");
    expect(wrapper.text()).toContain("Mật khẩu đã được cập nhật");
  });
});
