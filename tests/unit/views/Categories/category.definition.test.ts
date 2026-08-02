import { vi } from "vitest";
import { request } from "@/request";
import {
  categoryDefinition,
  categoryResource,
  materialDefinition,
} from "@/views/Categories/config";

describe("category definition", () => {
  it("declares separate resource definitions instead of type tabs", () => {
    expect([categoryDefinition.endpoint, materialDefinition.endpoint]).toEqual([
      "/categories",
      "/materials",
    ]);
  });

  it("uses category permissions instead of warehouse permissions", () => {
    expect(categoryDefinition.permission).toEqual({
      view: "categories.view",
      create: "categories.create",
      update: "categories.update",
      delete: "categories.delete",
    });
  });

  it("declares the complete desktop and mobile category fields", () => {
    expect(categoryDefinition.columns.map((column) => column.key)).toEqual([
      "name",
      "productCount",
      "createdBy",
    ]);
    expect(categoryDefinition.form?.fields.map((field) => field.key)).toEqual([
      "name",
      "description",
    ]);
    expect(categoryDefinition.form?.fields.find((field) => field.key === "name")?.required).toBe(true);
    expect(categoryDefinition.form?.fields.find((field) => field.key === "description")?.required).toBeUndefined();
    expect(categoryDefinition.columns.find((column) => column.key === "createdBy")?.display).toMatchObject({
      avatar: "createdBy.avatar",
      title: "createdBy.name",
      desc: "createdBy.description",
    });
    expect("responsive" in categoryDefinition).toBe(false);
  });

  it("owns the category list endpoint and PATCH update behavior in one declaration", async () => {
    const requestSpy = vi.spyOn(request, "request")
      .mockResolvedValueOnce({
        status: 200,
        data: { items: [], page: 1, limit: 20, total: 0, totalPages: 0 },
        headers: {},
      } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { item: { id: "category-1" } },
        headers: {},
      } as never);

    await categoryResource.transport.list({
      page: 1,
      limit: 20,
      query: "vàng",
      filters: {},
      sortBy: "name",
      sortDirection: "asc",
    });
    await categoryResource.transport.update("category-1", {
      name: "Nhẫn cưới",
      description: "Dành cho lễ cưới",
    });

    expect(requestSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
      method: "get",
      url: "/categories",
      params: {
        page: 1,
        limit: 20,
        query: "vàng",
        sortBy: "name",
        sortDirection: "asc",
      },
    }));
    expect(requestSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
      method: "patch",
      url: "/categories/category-1",
      data: { name: "Nhẫn cưới", description: "Dành cho lễ cưới" },
    }));
    requestSpy.mockRestore();
  });
});
