import { expect, it } from "vitest";
import {
  defineResource,
  type ResourceDeclaration,
} from "@/components/resource/contracts";

it("keeps endpoint and update behavior in one resource declaration", async () => {
  const resource = defineResource<{ id: string }, { name: string }, { status: string }>({
    key: "categories",
    definition: {
      key: "categories",
      title: "Danh mục",
      endpoint: "/categories",
      permission: {},
      columns: [],
      actions: {},
    },
    initialFilters: { status: "" },
    selectedColumns: ["name"],
    initialSort: { by: "updatedAt", direction: "desc" },
    emptyForm: () => ({ name: "" }),
    formFromRow: (row) => ({ name: row.id }),
    labels: {
      singular: "danh mục",
      create: "Đã thêm danh mục",
      update: "Đã cập nhật danh mục",
      delete: "Đã xóa danh mục",
    },
    transport: {
      list: async () => ({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 }),
      create: async () => ({ id: "new" }),
      update: async () => ({ id: "updated" }),
      remove: async () => undefined,
    },
  } satisfies ResourceDeclaration<{ id: string }, { name: string }, { status: string }>);

  expect(resource.definition.endpoint).toBe("/categories");
  await expect(resource.transport.update("category-1", { name: "Nhẫn" }))
    .resolves.toEqual({ id: "updated" });
});
