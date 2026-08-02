import { vi } from "vitest";
import { request } from "@/request";
import { categoryResource } from "@/views/Categories/config";

describe("category resource declaration", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps POST creation and DELETE removal behind the shared resource facade", async () => {
    const requestSpy = vi.spyOn(request, "request")
      .mockResolvedValueOnce({
        status: 201,
        data: { item: { id: "category-2" } },
        headers: {},
      } as never)
      .mockResolvedValueOnce({ status: 204, data: undefined, headers: {} } as never);

    await categoryResource.transport.create({
      name: "Vòng tay",
      description: "",
    });
    await categoryResource.transport.remove("category-2");

    expect(requestSpy).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: "/categories",
      data: { name: "Vòng tay", description: "" },
    });
    expect(requestSpy).toHaveBeenNthCalledWith(2, {
      method: "delete",
      url: "/categories/category-2",
    });
  });
});
