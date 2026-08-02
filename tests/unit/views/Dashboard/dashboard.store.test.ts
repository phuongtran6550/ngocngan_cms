import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { dashboardService } from "@/views/Dashboard/service";
import { useDashboardStore } from "@/views/Dashboard/store";

describe("dashboard store", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.restoreAllMocks());

  it("ignores stale overview responses", async () => {
    const store = useDashboardStore();
    let resolveFirst!: (value: never) => void;
    let resolveSecond!: (value: never) => void;
    const first = new Promise((resolve) => { resolveFirst = resolve as (value: never) => void; });
    const second = new Promise((resolve) => { resolveSecond = resolve as (value: never) => void; });
    vi.spyOn(dashboardService, "overview").mockReturnValueOnce(first as never).mockReturnValueOnce(second as never);

    const firstLoad = store.load();
    const secondLoad = store.load();
    resolveSecond({ period: { timezone: "new" }, kpis: {} } as never);
    await secondLoad;
    resolveFirst({ period: { timezone: "old" }, kpis: {} } as never);
    await firstLoad;

    expect(store.data?.period.timezone).toBe("new");
  });
});
