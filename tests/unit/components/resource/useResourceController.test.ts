import { describe, expect, it, vi } from "vitest";
import { useResourceController } from "@/components/resource/useResourceController";
import type {
  ResourceDeclaration,
  ResourceListResult,
} from "@/components/resource/contracts";

type Row = { id: string; name: string; usageCount?: number };
type Form = { name: string };
type Filters = { status: string };

function createResource(
  list = vi.fn().mockResolvedValue({
    items: [{ id: "new", name: "Mới" }],
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  }),
): ResourceDeclaration<Row, Form, Filters> {
  return {
    key: "categories",
    definition: {
      key: "categories",
      title: "Danh mục",
      endpoint: "/categories",
      permission: {},
      columns: [{ key: "name", label: "Tên", type: "text", sortable: true }],
      actions: {},
    },
    initialFilters: { status: "" },
    selectedColumns: ["name"],
    initialSort: { by: "updatedAt", direction: "desc" },
    emptyForm: () => ({ name: "" }),
    formFromRow: (row) => ({ name: row.name }),
    labels: {
      singular: "danh mục",
      create: "Đã thêm danh mục",
      update: "Đã cập nhật danh mục",
      delete: "Đã xóa danh mục",
    },
    transport: {
      list,
      create: vi.fn().mockResolvedValue({ id: "created", name: "Tạo" }),
      update: vi.fn().mockResolvedValue({ id: "updated", name: "Sửa" }),
      remove: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("useResourceController", () => {
  it("serializes filters through the declaration transport", async () => {
    const resource = createResource();
    const controller = useResourceController(resource);

    await controller.setFilter("status", "active");

    expect(resource.transport.list).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      query: "",
      filters: { status: "active" },
      sortBy: "updatedAt",
      sortDirection: "desc",
    }, expect.any(AbortSignal));
    expect(controller.items.value).toEqual([{ id: "new", name: "Mới" }]);
  });

  it("ignores a stale list response after a newer request finishes", async () => {
    let resolveFirst!: (value: ResourceListResult<Row>) => void;
    const first = new Promise<ResourceListResult<Row>>((resolve) => { resolveFirst = resolve; });
    const list = vi.fn()
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce({
        items: [{ id: "new", name: "Mới nhất" }],
        page: 2,
        limit: 20,
        total: 1,
        totalPages: 2,
      });
    const controller = useResourceController(createResource(list));

    const staleLoad = controller.load(1);
    await controller.load(2);
    resolveFirst({
      items: [{ id: "old", name: "Cũ" }],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 2,
    });
    await staleLoad;

    expect(controller.items.value).toEqual([{ id: "new", name: "Mới nhất" }]);
    expect(controller.pagination.value.page).toBe(2);
  });

  it("uses the update transport and reloads the current page", async () => {
    const resource = createResource();
    const controller = useResourceController(resource);
    controller.pagination.value = { page: 3, limit: 20, total: 1, totalPages: 3 };
    controller.openEdit({ id: "category-1", name: "Nhẫn" });

    await controller.save({ name: "Nhẫn cưới" });

    expect(resource.transport.update).toHaveBeenCalledWith("category-1", { name: "Nhẫn cưới" });
    expect(controller.message.value).toBe("Đã cập nhật danh mục");
    expect(controller.drawerOpen.value).toBe(false);
    expect(resource.transport.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }), expect.any(AbortSignal));
  });

  it("uses the previous page when deleting its last row", async () => {
    const resource = createResource();
    const controller = useResourceController(resource);
    controller.items.value = [{ id: "category-1", name: "Nhẫn" }];
    controller.pagination.value = { page: 2, limit: 20, total: 21, totalPages: 2 };
    controller.requestDelete(controller.items.value[0]);

    await controller.confirmDelete();

    expect(resource.transport.remove).toHaveBeenCalledWith("category-1");
    expect(resource.transport.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }), expect.any(AbortSignal));
  });
});
