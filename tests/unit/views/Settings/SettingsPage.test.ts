import { mount } from "@vue/test-utils";
import SettingsPage from "@/views/Settings/index.vue";

describe("SettingsPage", () => {
  it("composes the silver price and Zalo authorization sections", () => {
    const wrapper = mount(SettingsPage, {
      global: {
        stubs: {
          PageHeader: { template: "<header><slot name='actions' /></header>" },
          SilverPriceSection: { template: "<section data-testid='silver-section'>Giá bạc</section>" },
          ZaloAuthorizationSection: { template: "<section data-testid='zalo-section'>Ủy quyền Zalo OA</section>" },
        },
      },
    });

    expect(wrapper.get('[data-testid="silver-section"]').text()).toContain("Giá bạc");
    expect(wrapper.get('[data-testid="zalo-section"]').text()).toContain("Ủy quyền Zalo OA");
  });
});
