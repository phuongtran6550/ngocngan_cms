import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { orderService } from "@/views/Orders/service";
import { useOrderStore } from "@/views/Orders/store";
import { optimizeImage } from "@/utils/image-optimizer";

vi.mock("@/utils/image-optimizer", () => ({
  optimizeImage: vi.fn(async (file: File) => file),
}));

const draftOrder = {
  id: "order-1",
  name: "",
  phone: "",
  price: 0,
  thumbnail: "/uploads/order.jpg",
  images: ["/uploads/order.jpg"],
  status: "draft" as const,
  sell: true,
  isRemoved: false,
  items: [],
};

describe("order store", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.restoreAllMocks());

  it("creates the draft once and uses thumbnail patch for a retake", async () => {
    const store = useOrderStore();
    const createDraft = vi.spyOn(orderService, "createDraft").mockResolvedValue(draftOrder);
    const updateThumbnail = vi.spyOn(orderService, "updateThumbnail").mockResolvedValue({
      ...draftOrder,
      thumbnail: "/uploads/retake.jpg",
    });
    const first = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const retake = new File(["second"], "second.jpg", { type: "image/jpeg" });

    await store.capture(first);
    await store.capture(retake);

    expect(optimizeImage).toHaveBeenCalledTimes(2);
    expect(createDraft).toHaveBeenCalledTimes(1);
    expect(updateThumbnail).toHaveBeenCalledTimes(1);
    expect(updateThumbnail).toHaveBeenCalledWith("order-1", retake, expect.any(Function));
  });

  it("saves form data by patching the draft id", async () => {
    const store = useOrderStore();
    store.draft = draftOrder;
    const update = vi.spyOn(orderService, "update").mockResolvedValue({
      ...draftOrder,
      name: "Nguyễn An",
      phone: "0909000000",
      price: 2_500_000,
      status: "completed",
    });
    const createDraft = vi.spyOn(orderService, "createDraft");

    await store.saveDraft({
      name: "Nguyễn An",
      phone: "0909000000",
      price: 2_500_000,
      sell: true,
      items: [],
    });

    expect(createDraft).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith("order-1", expect.objectContaining({ name: "Nguyễn An" }));
    expect(store.draft?.status).toBe("completed");
  });

  it("ignores a stale list response that finishes after a newer request", async () => {
    const store = useOrderStore();
    let resolveFirst!: (value: never) => void;
    let resolveSecond!: (value: never) => void;
    const first = new Promise((resolve) => { resolveFirst = resolve as (value: never) => void; });
    const second = new Promise((resolve) => { resolveSecond = resolve as (value: never) => void; });
    vi.spyOn(orderService, "list").mockReturnValueOnce(first as never).mockReturnValueOnce(second as never);

    const firstLoad = store.load(1);
    const secondLoad = store.load(2);
    resolveSecond({ items: [{ ...draftOrder, id: "new" }], page: 2, limit: 20, total: 1, totalPages: 2 } as never);
    await secondLoad;
    resolveFirst({ items: [{ ...draftOrder, id: "old" }], page: 1, limit: 20, total: 1, totalPages: 2 } as never);
    await firstLoad;

    expect(store.items[0]?.id).toBe("new");
    expect(store.pagination.page).toBe(2);
  });

  it("loads the dedicated missing-info queue", async () => {
    const store = useOrderStore();
    vi.spyOn(orderService, "missing").mockResolvedValue({
      items: [draftOrder],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });

    await store.loadMissing(1);

    expect(orderService.missing).toHaveBeenCalledWith(
      { page: 1, limit: 12 },
      expect.any(AbortSignal),
    );
    expect(store.missingItems).toEqual([expect.objectContaining({ id: "order-1", status: "draft" })]);
  });

  it("refreshes the current missing queue without enabling the full loading skeleton", async () => {
    const store = useOrderStore();
    store.missingPagination.page = 3;
    vi.spyOn(orderService, "missing").mockResolvedValue({
      items: [{ ...draftOrder, customerInfoStatus: "review_required" } as never],
      page: 3,
      limit: 12,
      total: 1,
      totalPages: 3,
    });

    await store.refreshMissing();

    expect(orderService.missing).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3, limit: 12 }),
      expect.any(AbortSignal),
    );
    expect(store.missingLoading).toBe(false);
    expect(store.missingItems[0]?.customerInfoStatus).toBe("review_required");
  });

  it("replaces a detail thumbnail without turning it into the create-page draft", async () => {
    const store = useOrderStore();
    const file = new File(["retake"], "retake.jpg", { type: "image/jpeg" });
    vi.spyOn(orderService, "updateThumbnail").mockResolvedValue({
      ...draftOrder,
      thumbnail: "/uploads/retake.jpg",
    });

    const updated = await store.replaceThumbnail(draftOrder, file);

    expect(updated.thumbnail).toBe("/uploads/retake.jpg");
    expect(store.draft).toBeNull();
  });
});
