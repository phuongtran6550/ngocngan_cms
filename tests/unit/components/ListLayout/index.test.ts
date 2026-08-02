import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ListShell from "@/components/ListLayout/ListShell.vue";
import type { ResourceDefinition } from "@/config/resource";

function setViewportMatch(matches: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches,
      media: "(max-width: 767.98px)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    })),
  });
}

function definition(key = "categories"): ResourceDefinition {
  return {
    key,
    title: "Danh mục sản phẩm",
    endpoint: "/categories",
    permission: { view: "categories.view" },
    columns: [
      { key: "name", label: "Tên danh mục", type: "text" },
      { key: "status", label: "Trạng thái", type: "status" },
    ],
    actions: {
      create: true,
      update: true,
      delete: true,
      refresh: true,
      fieldSelector: true,
    },
  };
}

function shellProps(key = "categories") {
  return {
    definition: definition(key),
    rows: [{ id: "1", name: "Nhẫn", status: "active" }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  };
}

describe("ListShell view modes", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setViewportMatch(false);
    vi.restoreAllMocks();
  });

  it("shows DataTable by default on desktop and Card Grid by default on mobile", () => {
    setViewportMatch(false);
    const desktop = mount(ListShell, {
      props: shellProps("desktop-categories"),
    });

    expect(desktop.get('[data-testid="desktop-data-table"]').exists()).toBe(
      true,
    );
    expect(desktop.find('[data-testid="resource-card-grid"]').exists()).toBe(
      false,
    );

    setViewportMatch(true);
    const mobile = mount(ListShell, { props: shellProps("mobile-categories") });

    expect(mobile.get('[data-testid="resource-card-grid"]').exists()).toBe(
      true,
    );
    expect(mobile.find('[data-testid="desktop-data-table"]').exists()).toBe(
      false,
    );
  });

  it("switches views without changing pagination and persists per resource", async () => {
    const wrapper = mount(ListShell, {
      props: shellProps("switch-categories"),
    });
    const viewToggle = wrapper.get('[data-testid="view-mode-toggle"]');
    const totalSummary = wrapper.get('[data-testid="list-total-summary"]');
    const tableToggle = wrapper.get('[data-testid="view-mode-table"]');
    const gridToggle = wrapper.get('[data-testid="view-mode-grid"]');
    const listSurface = wrapper.get('[data-testid="list-view-surface"]');

    expect(viewToggle.attributes("role")).toBe("group");
    expect(viewToggle.attributes("aria-label")).toBe(
      "Chế độ hiển thị danh sách",
    );
    expect(totalSummary.get(".list-total-summary__label").text()).toBe("ALL");
    expect(totalSummary.get(".list-total-summary__count").text()).toBe("(1)");
    expect(totalSummary.attributes("aria-label")).toBe("Tổng số bản ghi: 1");
    expect(tableToggle.text()).toContain("Bảng");
    expect(gridToggle.text()).toContain("Thẻ");
    expect(tableToggle.attributes("type")).toBe("button");
    expect(gridToggle.attributes("type")).toBe("button");
    expect(tableToggle.attributes("title")).toBe("Hiển thị dạng bảng");
    expect(gridToggle.attributes("title")).toBe("Hiển thị dạng thẻ");
    expect(tableToggle.attributes("aria-label")).toBe("Hiển thị dạng bảng");
    expect(gridToggle.attributes("aria-label")).toBe("Hiển thị dạng thẻ");
    expect(tableToggle.classes()).toEqual(
      expect.arrayContaining(["list-view-toggle__option", "is-active"]),
    );
    expect(gridToggle.classes()).toEqual(
      expect.arrayContaining(["list-view-toggle__option"]),
    );
    expect(gridToggle.classes()).not.toContain("is-active");
    expect(tableToggle.attributes("aria-pressed")).toBe("true");
    expect(gridToggle.attributes("aria-pressed")).toBe("false");
    expect(listSurface.classes()).toContain("bg-body-emphasis");

    await gridToggle.trigger("click");

    expect(wrapper.get('[data-testid="resource-card-grid"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="desktop-data-table"]').exists()).toBe(
      false,
    );
    expect(wrapper.emitted("page")).toBeUndefined();
    expect(
      window.localStorage.getItem("ngoc-chau:list-view:switch-categories"),
    ).toBe("grid");
    expect(tableToggle.text()).toContain("Bảng");
    expect(gridToggle.text()).toContain("Thẻ");
    expect(tableToggle.classes()).not.toContain("is-active");
    expect(gridToggle.classes()).toEqual(
      expect.arrayContaining(["list-view-toggle__option", "is-active"]),
    );
    expect(tableToggle.attributes("aria-pressed")).toBe("false");
    expect(gridToggle.attributes("aria-pressed")).toBe("true");
    expect(totalSummary.get(".list-total-summary__count").text()).toBe("(1)");
    expect(listSurface.classes()).toContain("list-view-surface--grid");
    expect(listSurface.classes()).not.toContain("bg-body-emphasis");
    expect(listSurface.classes()).not.toContain("border-top");
    expect(listSurface.classes()).not.toContain("border-bottom");
  });
});
