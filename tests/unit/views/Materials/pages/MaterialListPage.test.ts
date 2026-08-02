import {
  DOMWrapper,
  flushPromises,
  mount,
  type VueWrapper,
} from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import MaterialListPage from "@/views/Materials/index.vue";
import { request } from "@/request";
import { PERMISSIONS } from "@/config/permissions";
import { authenStore } from "@/stores/app-authen";

describe("MaterialListPage", () => {
  const listResponse = {
    items: [
      {
        id: "material-1",
        name: "Vàng 18K",
        description: "Vàng tây",
        productCount: 6,
        createdBy: { id: "user-1", name: "Phương Trần" },
      },
    ],
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(request, "request").mockResolvedValue({
      status: 200,
      data: listResponse,
      headers: {},
    } as never);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  function mountAs(permissions: string[]): Promise<VueWrapper> {
    const auth = authenStore();
    auth.token = "material-token";
    auth.user = { role: "USER", permissions };
    const wrapper = mount(MaterialListPage, {
      attachTo: document.body,
      global: {
        mocks: { $route: { query: {} } },
        stubs: { RouterLink: true },
      },
    });
    return flushPromises().then(() => wrapper);
  }

  function bodyControl(selector: string): DOMWrapper<Element> {
    const element = document.body.querySelector(selector);
    if (!element) throw new Error(`Expected ${selector} in document body`);
    return new DOMWrapper(element);
  }

  it("renders only the Materials columns and form fields", async () => {
    const auth = authenStore();
    auth.token = "admin-token";
    auth.user = { role: "ADMINISTRATOR", permissions: [] };
    const wrapper = mount(MaterialListPage, {
      global: {
        mocks: { $route: { query: {} } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Quản lý chất liệu");
    expect(wrapper.text()).toContain("Vàng 18K");
    expect(wrapper.find("tbody td:nth-child(2)").text()).toBe("6");
    expect(wrapper.text()).toContain("Phương Trần");
    expect(wrapper.find("tbody td:nth-child(3)").text()).not.toContain(
      "Vàng tây",
    );
    expect(wrapper.findAll("th").map((header) => header.text())).toEqual([
      "Tên chất liệu",
      "Số sản phẩm",
      "Người tạo",
      "Thao tác",
    ]);
    expect(wrapper.find('[data-testid="default-avatar"]').exists()).toBe(true);
    expect(wrapper.find("[role=tablist]").exists()).toBe(false);
    await wrapper.get("[data-testid=list-create]").trigger("click");
    await flushPromises();
    expect(
      document.body
        .querySelector("input[name=name]")
        ?.getAttribute("maxlength"),
    ).toBe("120");
    expect(
      document.body
        .querySelector("textarea[name=description]")
        ?.getAttribute("maxlength"),
    ).toBe("500");
    expect(document.body.querySelector("select[name=status]")).toBeNull();
    wrapper.unmount();
  });

  it("hides material mutations without the matching Materials permissions", async () => {
    const auth = authenStore();
    auth.token = "material-reader-token";
    auth.user = { role: "USER", permissions: [PERMISSIONS.materialsView] };
    const wrapper = mount(MaterialListPage, {
      global: {
        mocks: { $route: { query: {} } },
        stubs: { RouterLink: true },
      },
    });
    await flushPromises();

    expect(wrapper.find("[data-testid=list-create]").exists()).toBe(false);
    expect(wrapper.find("[data-testid=row-action-menu]").exists()).toBe(false);
    wrapper.unmount();
  });

  it("POSTs only the material form fields with create permission", async () => {
    const requestSpy = vi.mocked(request.request);
    const wrapper = await mountAs([
      PERMISSIONS.materialsView,
      PERMISSIONS.materialsCreate,
    ]);

    expect(wrapper.get("[data-testid=list-create]").exists()).toBe(true);
    await wrapper.get("[data-testid=list-create]").trigger("click");
    await bodyControl('input[name="name"]').setValue("Bạc 925");
    await bodyControl('textarea[name="description"]').setValue("Bạc trang sức");
    await bodyControl("form").trigger("submit");
    await flushPromises();

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "post",
        url: "/materials",
        data: { name: "Bạc 925", description: "Bạc trang sức" },
      }),
    );
    wrapper.unmount();
  });

  it("shows the required name error below the field without sending a POST request", async () => {
    const requestSpy = vi.mocked(request.request);
    const wrapper = await mountAs([
      PERMISSIONS.materialsView,
      PERMISSIONS.materialsCreate,
    ]);

    await wrapper.get("[data-testid=list-create]").trigger("click");
    await bodyControl('input[name="name"]').setValue("   ");
    await bodyControl("form").trigger("submit");
    await flushPromises();

    expect(document.body.textContent).toContain("Tên chất liệu là bắt buộc");
    expect(requestSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        method: "post",
        url: "/materials",
      }),
    );
    wrapper.unmount();
  });

  it("PATCHes only the material form fields and preserves a cleared description", async () => {
    const requestSpy = vi.mocked(request.request);
    const wrapper = await mountAs([
      PERMISSIONS.materialsView,
      PERMISSIONS.materialsUpdate,
    ]);

    expect(wrapper.find("[data-testid=list-create]").exists()).toBe(false);
    await wrapper.get('[data-testid="row-action-toggle"]').trigger("click");
    expect(document.body.querySelector('[data-testid="row-action-edit"]')).not.toBeNull();
    expect(document.body.querySelector('[data-testid="row-action-delete"]')).toBeNull();
    await bodyControl('[data-testid="row-action-edit"]').trigger("click");
    await bodyControl('textarea[name="description"]').setValue("");
    await bodyControl("form").trigger("submit");
    await flushPromises();

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "patch",
        url: "/materials/material-1",
        data: { name: "Vàng 18K", description: "" },
      }),
    );
    wrapper.unmount();
  });

  it("DELETEs the selected material with delete permission only", async () => {
    const requestSpy = vi.mocked(request.request);
    const wrapper = await mountAs([
      PERMISSIONS.materialsView,
      PERMISSIONS.materialsDelete,
    ]);

    expect(wrapper.find("[data-testid=list-create]").exists()).toBe(false);
    await wrapper.get('[data-testid="row-action-toggle"]').trigger("click");
    expect(document.body.querySelector('[data-testid="row-action-edit"]')).toBeNull();
    expect(document.body.querySelector('[data-testid="row-action-delete"]')).not.toBeNull();
    await bodyControl('[data-testid="row-action-delete"]').trigger("click");
    await bodyControl(".modal-footer .btn-danger").trigger("click");
    await flushPromises();

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "delete",
        url: "/materials/material-1",
      }),
    );
    const deleteCall = requestSpy.mock.calls.find(
      ([config]) => config?.method === "delete",
    );
    expect(deleteCall?.[0]).not.toHaveProperty("data");
    wrapper.unmount();
  });
});
