import { vi } from "vitest";
import { request } from "@/request";
import { orderService } from "@/views/Orders/service";

describe("order service", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads orders through the shared request client", async () => {
    const get = vi.spyOn(request, "get").mockResolvedValue({
      data: { items: [], page: 2, limit: 20, total: 0, totalPages: 0 },
    } as never);

    await orderService.list({
      page: 2,
      limit: 20,
      query: "0909",
      status: "completed",
      sortBy: "updatedAt",
      sortDirection: "desc",
    });

    expect(get).toHaveBeenCalledWith("/orders", {
      params: {
        page: 2,
        limit: 20,
        query: "0909",
        status: "completed",
        sortBy: "updatedAt",
        sortDirection: "desc",
      },
      signal: undefined,
    });
  });

  it("creates one multipart draft with an idempotency key", async () => {
    const post = vi.spyOn(request, "post").mockResolvedValue({ data: { order: { id: "order-1" } } } as never);
    const file = new File(["image"], "order.jpg", { type: "image/jpeg" });

    await orderService.createDraft(file);

    const [url, body, config] = post.mock.calls[0] || [];
    expect(url).toBe("/orders");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("thumbnail")).toBe(file);
    expect((body as FormData).get("status")).toBe("draft");
    expect(config).toEqual(expect.objectContaining({
      headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }),
    }));
  });

  it("patches the existing draft instead of posting another order", async () => {
    const patch = vi.spyOn(request, "patch").mockResolvedValue({ data: { order: { id: "order-1" } } } as never);
    const post = vi.spyOn(request, "post");

    await orderService.update("order-1", {
      name: "Nguyễn An",
      phone: "0909000000",
      price: 2_500_000,
      sell: true,
      items: [{ id: "line-1", categoryId: "category-1", category: "Nhẫn", price: 2_500_000 }],
    });

    expect(post).not.toHaveBeenCalled();
    expect(patch).toHaveBeenCalledWith(
      "/orders/order-1",
      expect.objectContaining({ name: "Nguyễn An", price: 2_500_000 }),
      expect.objectContaining({ headers: { "Idempotency-Key": expect.any(String) } }),
    );
  });

  it("replaces a draft thumbnail through the dedicated endpoint", async () => {
    const patch = vi.spyOn(request, "patch").mockResolvedValue({ data: { order: { id: "order-1" } } } as never);
    const file = new File(["retake"], "retake.jpg", { type: "image/jpeg" });

    await orderService.updateThumbnail("order-1", file);

    const [url, body, config] = patch.mock.calls[0] || [];
    expect(url).toBe("/orders/order-1/thumbnail");
    expect((body as FormData).get("thumbnail")).toBe(file);
    expect(config).toEqual(expect.objectContaining({
      headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }),
    }));
  });
});
