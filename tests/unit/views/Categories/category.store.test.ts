import { vi } from "vitest";
import { useResourceController } from "@/components/resource/useResourceController";
import { categoryResource } from "@/views/Categories/config";

const category = {
  id: "category-1",
  name: "Nhẫn",
  description: "Nhóm nhẫn",
  createdBy: { id: "user-1", name: "Ngọc Châu" },
};

describe("category resource controller", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens deletion confirmation without relying on a stored usage counter", () => {
    const controller = useResourceController(categoryResource);

    controller.requestDelete(category);

    expect(controller.deleteTarget.value).toEqual(category);
    expect(controller.error.value).toBe("");
  });

  it("keeps an in-use category visible and reports the API error", async () => {
    const controller = useResourceController(categoryResource);
    controller.items.value = [category];
    controller.deleteTarget.value = category;
    vi.spyOn(categoryResource.transport, "remove").mockRejectedValue({
      message: "Danh mục đang được sử dụng và không thể xóa",
      code: "CATEGORY_IN_USE",
      status: 409,
      errors: { usageCount: 3 },
    });

    await controller.confirmDelete();

    expect(controller.items.value).toHaveLength(1);
    expect(controller.error.value).toBe(
      "Danh mục đang được sử dụng bởi 3 sản phẩm nên không thể xóa.",
    );
    expect(controller.deleteTarget.value).toBeNull();
  });

  it("refreshes the current page after an update", async () => {
    const controller = useResourceController(categoryResource);
    const editable = { ...category };
    controller.pagination.value.page = 3;
    controller.openEdit(editable);
    vi.spyOn(categoryResource.transport, "update").mockResolvedValue(editable);
    const list = vi.spyOn(categoryResource.transport, "list").mockResolvedValue({
      items: [], page: 3, limit: 20, total: 0, totalPages: 0,
    });

    await controller.save({ name: "Nhẫn cưới", description: "Mô tả mới" });

    expect(controller.pagination.value.page).toBe(3);
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }), expect.any(AbortSignal));
  });
});
