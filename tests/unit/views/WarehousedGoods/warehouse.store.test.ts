import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { warehouseService } from "@/views/WarehousedGoods/service";
import { useWarehouseStore } from "@/views/WarehousedGoods/store";

describe("warehouse store", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.restoreAllMocks());

  it("ignores stale inventory responses", async () => {
    const store = useWarehouseStore();
    let resolveFirst!: (value: never) => void;
    let resolveSecond!: (value: never) => void;
    const first = new Promise((resolve) => {
      resolveFirst = resolve as (value: never) => void;
    });
    const second = new Promise((resolve) => {
      resolveSecond = resolve as (value: never) => void;
    });
    vi.spyOn(warehouseService, "list")
      .mockReturnValueOnce(first as never)
      .mockReturnValueOnce(second as never);

    const firstLoad = store.load(1);
    const secondLoad = store.load(2);
    resolveSecond({
      items: [{ id: "new", name: "Mới" }],
      page: 2,
      limit: 20,
      total: 1,
      totalPages: 2,
    } as never);
    await secondLoad;
    resolveFirst({
      items: [{ id: "old", name: "Cũ" }],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 2,
    } as never);
    await firstLoad;

    expect(store.items[0]?.id).toBe("new");
    expect(store.pagination.page).toBe(2);
  });
});
