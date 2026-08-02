import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "@/request";
import { resourceRequest } from "@/request/resource-client";

describe("resourceRequest", () => {
  afterEach(() => vi.restoreAllMocks());

  it("wraps a normalized response in the shared resource result", async () => {
    vi.spyOn(request, "request").mockResolvedValue({
      status: 200,
      data: { items: [{ id: "category-1" }] },
      headers: { etag: "catalog-v1" },
    } as never);

    await expect(
      resourceRequest<{ items: Array<{ id: string }> }>({
        method: "get",
        url: "/categories",
      }),
    ).resolves.toEqual({
      status: "success",
      statusCode: 200,
      status_code: 200,
      response: { items: [{ id: "category-1" }] },
      headers: { etag: "catalog-v1" },
    });
  });

  it("preserves normalized domain errors", async () => {
    vi.spyOn(request, "request").mockRejectedValue({
      message: "Danh mục đang được sử dụng",
      code: "CATEGORY_IN_USE",
      status: 409,
    });

    await expect(
      resourceRequest({ method: "delete", url: "/categories/category-1" }),
    ).rejects.toMatchObject({ code: "CATEGORY_IN_USE", status: 409 });
  });
});
