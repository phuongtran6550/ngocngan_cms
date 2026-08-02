import { mount } from "@vue/test-utils";
import PageHeader from "@/components/app/PageHeader.vue";

describe("PageHeader", () => {
  it("renders Phoenix-style hierarchy, metadata, and actions", () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: "Danh mục",
        description: "Quản lý nhóm Đại và Nhóm Trung dùng cho sản phẩm.",
        breadcrumbs: [
          { label: "Tổng quan", to: "/dashboard" },
          { label: "Danh mục" },
        ],
      },
      global: {
        stubs: { RouterLink: { template: "<a><slot /></a>" } },
      },
      slots: { actions: '<button type="button">Thêm mới</button>' },
    });

    expect(wrapper.get("h2.mb-2").text()).toBe("Danh mục");
    expect(wrapper.get("h5.text-body-tertiary.fw-semibold").text()).toContain(
      "Quản lý nhóm Đại",
    );
    expect(wrapper.find("section").exists()).toBe(false);
    expect(wrapper.get(".breadcrumb").text()).toContain("Tổng quan");
    expect(wrapper.get('[data-testid="page-header-actions"]').text()).toBe(
      "Thêm mới",
    );
  });

  it("does not render optional visual regions when they have no content", () => {
    const wrapper = mount(PageHeader, { props: { title: "Đơn hàng" } });

    expect(wrapper.find(".breadcrumb").exists()).toBe(false);
    expect(wrapper.find("p").exists()).toBe(false);
    expect(wrapper.find('[data-testid="page-header-actions"]').exists()).toBe(
      false,
    );
  });
});
