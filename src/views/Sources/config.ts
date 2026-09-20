import { PERMISSIONS } from "@/config/permissions";
import type { ResourceDefinition } from "@/config/resource";
import {
  defineResource,
  type ResourceDeclaration,
  type ResourceListInput,
} from "@/components/resource/contracts";
import { sourceService } from "@/views/Sources/service";
import type {
  SourceItem,
  SourceListParams,
  SourceListResponse,
} from "@/views/Sources/types";

export const sourceDefinition: ResourceDefinition = {
  key: "source-of-goods",
  title: "Quản lý nguồn hàng",
  description: "Tổng giá nhập gồm số liệu lịch sử đã chuyển đổi và hàng nhập mới; số sản phẩm phản ánh hàng nhập kho hiện có.",
  breadcrumbs: [
    { text: "Trang chủ", link: "/" },
    { text: "Nguồn hàng" },
  ],
  endpoint: "/source-of-goods",
  permission: {
    view: PERMISSIONS.sourceGoodsView,
    delete: PERMISSIONS.sourceGoodsDelete,
  },
  columns: [
    { key: "name", label: "Nguồn hàng", type: "text", sortable: true },
    { key: "phone", label: "Số điện thoại", type: "text" },
    { key: "itemCount", label: "Số sản phẩm", type: "number", sortable: true },
    { key: "totalImportValue", label: "Tổng giá nhập", type: "money", sortable: true },
    { key: "latestImportAt", label: "Nhập gần nhất", type: "datetime", sortable: true },
  ],
  actions: { view: true, delete: true, refresh: true, fieldSelector: true },
};

type SourceFilters = Record<string, never>;
type SourceFormModel = Record<string, never>;

function sourceListParams(
  input: ResourceListInput<SourceFilters>,
): SourceListParams {
  return {
    page: input.page,
    limit: input.limit,
    query: input.query || undefined,
    sortBy: input.sortBy as NonNullable<SourceListParams["sortBy"]>,
    sortDirection: input.sortDirection,
  };
}

export const sourceResource: ResourceDeclaration<
  SourceItem,
  SourceFormModel,
  SourceFilters
> = defineResource<SourceItem, SourceFormModel, SourceFilters>({
  key: "source-of-goods",
  definition: sourceDefinition,
  initialFilters: {},
  selectedColumns: ["name", "phone", "itemCount", "totalImportValue", "latestImportAt"],
  initialSort: { by: "totalImportValue", direction: "desc" },
  viewPermission: PERMISSIONS.warehouseView,
  emptyForm: () => ({}),
  formFromRow: () => ({}),
  labels: {
    singular: "nguồn hàng",
    create: "",
    update: "",
    delete: "Đã xóa nguồn hàng",
  },
  transport: {
    list(
      input: ResourceListInput<SourceFilters>,
      signal?: AbortSignal,
    ): Promise<SourceListResponse> {
      return sourceService.list(sourceListParams(input), signal);
    },
    async create(): Promise<SourceItem> {
      throw new Error("Không hỗ trợ tạo nguồn hàng trực tiếp");
    },
    async update(): Promise<SourceItem> {
      throw new Error("Không hỗ trợ cập nhật nguồn hàng trực tiếp");
    },
    async remove(id: string): Promise<void> {
      await sourceService.remove(id);
    },
  },
});
