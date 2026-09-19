import { PERMISSIONS } from "@/config/permissions";
import type { ResourceDefinition } from "@/config/resource";
import {
  defineReadonlyResource,
  type ReadonlyResourceDeclaration,
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
  permission: { view: PERMISSIONS.sourceGoodsView },
  columns: [
    { key: "name", label: "Nguồn hàng", type: "text", sortable: true },
    { key: "phone", label: "Số điện thoại", type: "text" },
    { key: "itemCount", label: "Số sản phẩm", type: "number", sortable: true },
    { key: "totalImportValue", label: "Tổng giá nhập", type: "money", sortable: true },
    { key: "latestImportAt", label: "Nhập gần nhất", type: "datetime", sortable: true },
  ],
  actions: { view: true, refresh: true, fieldSelector: true },
};

type SourceFilters = Record<string, never>;

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

/** Historical source totals and current inventory are exposed as a read-only report. */
export const sourceResource: ReadonlyResourceDeclaration<
  SourceItem,
  SourceFilters
> = defineReadonlyResource<SourceItem, SourceFilters>({
  key: "source-of-goods",
  mode: "readonly",
  definition: sourceDefinition,
  initialFilters: {},
  selectedColumns: ["name", "phone", "itemCount", "totalImportValue", "latestImportAt"],
  initialSort: { by: "totalImportValue", direction: "desc" },
  viewPermission: PERMISSIONS.warehouseView,
  transport: {
    list(
      input: ResourceListInput<SourceFilters>,
      signal?: AbortSignal,
    ): Promise<SourceListResponse> {
      return sourceService.list(sourceListParams(input), signal);
    },
  },
});
