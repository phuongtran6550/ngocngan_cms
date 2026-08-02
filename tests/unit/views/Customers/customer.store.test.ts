import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { customerService } from "@/views/Customers/service";
import { useCustomerStore } from "@/views/Customers/store";

describe("customer store", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.restoreAllMocks());

  it("switches modes without retaining an incompatible sort", async () => {
    const store = useCustomerStore();
    store.sortBy = "price";
    vi.spyOn(customerService, "list").mockResolvedValue({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 });

    await store.activate("history");

    expect(store.mode).toBe("history");
    expect(store.sortBy).toBe("latestOrderAt");
    expect(customerService.list).toHaveBeenCalledWith("history", expect.objectContaining({ page: 1 }), expect.any(AbortSignal));
  });

  it("ignores stale customer responses", async () => {
    const store = useCustomerStore();
    let resolveFirst!: (value: never) => void;
    let resolveSecond!: (value: never) => void;
    const first = new Promise((resolve) => { resolveFirst = resolve as (value: never) => void; });
    const second = new Promise((resolve) => { resolveSecond = resolve as (value: never) => void; });
    vi.spyOn(customerService, "list").mockReturnValueOnce(first as never).mockReturnValueOnce(second as never);

    const firstLoad = store.load(1);
    const secondLoad = store.load(2);
    resolveSecond({ items: [{ id: "new", name: "Mới" }], page: 2, limit: 20, total: 1, totalPages: 2 } as never);
    await secondLoad;
    resolveFirst({ items: [{ id: "old", name: "Cũ" }], page: 1, limit: 20, total: 1, totalPages: 2 } as never);
    await firstLoad;

    expect(store.items[0]?.id).toBe("new");
  });
});
