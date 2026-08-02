import { nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListViewMode } from "@/components/ListLayout/useListViewMode";

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

describe("useListViewMode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    setViewportMatch(false);
  });

  it("defaults to table on desktop when no resource preference exists", () => {
    setViewportMatch(false);

    const { viewMode } = useListViewMode(ref("categories"));

    expect(viewMode.value).toBe("table");
  });

  it("defaults to grid on mobile when no resource preference exists", () => {
    setViewportMatch(true);

    const { viewMode } = useListViewMode(ref("categories"));

    expect(viewMode.value).toBe("grid");
  });

  it("restores and stores a preference per resource key", () => {
    setViewportMatch(false);
    const first = useListViewMode(ref("categories"));

    first.setViewMode("grid");

    expect(window.localStorage.getItem("ngoc-chau:list-view:categories")).toBe(
      "grid",
    );
    expect(useListViewMode(ref("categories")).viewMode.value).toBe("grid");
    expect(useListViewMode(ref("orders")).viewMode.value).toBe("table");
  });

  it("reloads the preference when the resource key changes", async () => {
    setViewportMatch(false);
    window.localStorage.setItem("ngoc-chau:list-view:orders", "grid");
    const resourceKey = ref("categories");
    const { viewMode } = useListViewMode(resourceKey);

    resourceKey.value = "orders";
    await nextTick();

    expect(viewMode.value).toBe("grid");
  });

  it("ignores malformed values and storage exceptions", () => {
    window.localStorage.setItem("ngoc-chau:list-view:categories", "cards");
    setViewportMatch(true);
    expect(useListViewMode(ref("categories")).viewMode.value).toBe("grid");

    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() =>
      useListViewMode(ref("orders")).setViewMode("grid"),
    ).not.toThrow();
  });

  it("uses the responsive default when reading storage fails", () => {
    setViewportMatch(true);
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(useListViewMode(ref("categories")).viewMode.value).toBe("grid");
  });

  it("falls back to table when matchMedia is missing or throws", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
    });
    expect(useListViewMode(ref("categories")).viewMode.value).toBe("table");

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => {
        throw new Error("unsupported");
      }),
    });
    expect(useListViewMode(ref("orders")).viewMode.value).toBe("table");
  });
});
