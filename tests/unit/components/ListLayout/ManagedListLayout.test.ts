import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import ManagedListLayout from "@/components/ListLayout/ManagedListLayout.vue";
import { authenStore } from "@/stores/app-authen";
import type { ResourceDeclaration } from "@/components/resource/contracts";

function createResource(): ResourceDeclaration<
  { id: string; name: string },
  { name: string },
  { status: string }
> {
  return {
    key: "categories",
    definition: {
      key: "categories",
      title: "Quản lý danh mục",
      endpoint: "/categories",
      permission: {
        create: "categories.create",
        update: "categories.update",
        delete: "categories.delete",
      },
      columns: [{ key: "name", label: "Tên", type: "text", sortable: true }],
      filters: [
        {
          key: "status",
          label: "Trạng thái",
          type: "select",
          options: [{ label: "Tất cả", value: "" }],
        },
      ],
      form: {
        fields: [{ key: "name", label: "Tên", type: "text", required: true }],
      },
      actions: {
        create: true,
        update: true,
        delete: true,
        refresh: true,
        fieldSelector: true,
      },
    },
    initialFilters: { status: "" },
    selectedColumns: ["name"],
    initialSort: { by: "name", direction: "asc" },
    emptyForm: () => ({ name: "" }),
    formFromRow: (row) => ({ name: row.name }),
    labels: {
      singular: "danh mục",
      create: "Đã thêm danh mục",
      update: "Đã cập nhật danh mục",
      delete: "Đã xóa danh mục",
    },
    transport: {
      list: vi.fn().mockResolvedValue({
        items: [{ id: "category-1", name: "Nhẫn" }],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      }),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
}

describe("ManagedListLayout", () => {
  it("owns one declaration through list loading and the standard form drawer", async () => {
    setActivePinia(createPinia());
    const auth = authenStore();
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    const resource = createResource();

    const wrapper = mount(ManagedListLayout, {
      props: { resource },
      global: {
        mocks: { $route: { query: { query: "  nhẫn cưới  " } } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(resource.transport.list).toHaveBeenCalledWith(
      expect.objectContaining({ query: "nhẫn cưới" }),
      expect.any(AbortSignal),
    );
    expect(wrapper.text()).toContain("Quản lý danh mục");
    expect(wrapper.text()).toContain("Nhẫn");
    await wrapper.get('[data-testid="list-create"]').trigger("click");
    expect(document.body.querySelector("form")).not.toBeNull();
    wrapper.unmount();
  });

  it("derives mutation actions from the declaration permissions", async () => {
    setActivePinia(createPinia());
    const auth = authenStore();
    auth.user = { role: "USER", permissions: ["categories.view"] };

    const wrapper = mount(ManagedListLayout, {
      props: { resource: createResource() },
      global: {
        mocks: { $route: { query: {} } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="list-create"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="row-action-menu"]').exists()).toBe(
      false,
    );
    wrapper.unmount();
  });
});
