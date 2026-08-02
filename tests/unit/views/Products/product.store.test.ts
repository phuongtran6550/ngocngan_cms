import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { productService } from "@/views/Products/service";
import { useProductStore } from "@/views/Products/store";

describe("product store", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.restoreAllMocks());

  it("ignores stale product list responses", async () => {
    const store = useProductStore();
    let resolveFirst!: (value: never) => void;
    let resolveSecond!: (value: never) => void;
    const first = new Promise((resolve) => {
      resolveFirst = resolve as (value: never) => void;
    });
    const second = new Promise((resolve) => {
      resolveSecond = resolve as (value: never) => void;
    });
    vi.spyOn(productService, "list")
      .mockReturnValueOnce(first as never)
      .mockReturnValueOnce(second as never);

    const firstLoad = store.load(1);
    const secondLoad = store.load(2);
    resolveSecond({
      items: [{ id: "new", productId: "warehouse-new" }],
      page: 2,
      limit: 20,
      total: 1,
      totalPages: 2,
    } as never);
    await secondLoad;
    resolveFirst({
      items: [{ id: "old", productId: "warehouse-old" }],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 2,
    } as never);
    await firstLoad;

    expect(store.items[0]?.id).toBe("new");
    expect(store.pagination.page).toBe(2);
  });

  it("clears only the three approved classification filters", async () => {
    const store = useProductStore();
    store.categoryId = "category-1";
    store.materialId = "material-1";
    store.patternId = "pattern-1";
    vi.spyOn(productService, "list").mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

    await store.clearFilters();

    expect(store.categoryId).toBe("");
    expect(store.materialId).toBe("");
    expect(store.patternId).toBe("");
  });

  it("ignores stale classification option responses", async () => {
    const store = useProductStore();
    let resolveFirst!: (value: never) => void;
    let resolveSecond!: (value: never) => void;
    vi.spyOn(productService, "options")
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve as (value: never) => void;
        }) as never,
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve as (value: never) => void;
        }) as never,
      );

    const first = store.loadOptions();
    const second = store.loadOptions();
    resolveSecond({
      categories: [{ id: "new", name: "Mới", type: "category" }],
      materials: [],
      patterns: [],
    } as never);
    await second;
    resolveFirst({
      categories: [{ id: "old", name: "Cũ", type: "category" }],
      materials: [],
      patterns: [],
    } as never);
    await first;

    expect(store.options.categories[0]?.id).toBe("new");
  });
});
