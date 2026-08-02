import { PERMISSIONS } from "@/config/permissions";
import type { ResourceDefinition } from "@/config/resource";
import {
  defineReadonlyResource,
  type ReadonlyResourceDeclaration,
  type ResourceListInput,
} from "@/components/resource/contracts";
import { customerService } from "@/views/Customers/service";
import type {
  CustomerAggregate,
  CustomerListParams,
  CustomerListResponse,
  CustomerMode,
} from "@/views/Customers/types";

export function customerDefinition(mode: CustomerMode): ResourceDefinition {
  const history = mode === "history";
  return {
    key: history ? "customer-history" : "customers",
    title: history ? "Lịch sử đổi trả" : "Khách hàng",
    description: history
      ? "Khách có phát sinh đơn đổi trả; số liệu luôn được tính lại từ trạng thái đơn hàng hiện tại."
      : "Doanh số và số đơn được tổng hợp trực tiếp từ đơn hàng hoàn tất, không dùng bộ đếm cộng dồn.",
    breadcrumbs: [
      { text: "Trang chủ", link: "/" },
      { text: history ? "Lịch sử đổi trả" : "Khách hàng" },
    ],
    endpoint: history ? "/customers/history" : "/customers",
    permission: { view: PERMISSIONS.customersView },
    columns: [
      { key: "name", label: "Khách hàng", type: "text", sortable: true },
      { key: "phone", label: "Điện thoại", type: "text", sortable: true },
      { key: "price", label: "Tổng mua", type: "money", sortable: true },
      { key: "priceReturn", label: "Tổng đổi trả", type: "money", sortable: true },
      { key: "orderCount", label: "Số đơn", type: "number", sortable: true },
      { key: "latestOrderAt", label: "Giao dịch gần nhất", type: "datetime", sortable: true },
    ],
    actions: { view: true, refresh: true, fieldSelector: true },
  };
}

type CustomerFilters = Record<string, never>;

function customerListParams(
  input: ResourceListInput<CustomerFilters>,
): CustomerListParams {
  return {
    page: input.page,
    limit: input.limit,
    query: input.query || undefined,
    sortBy: input.sortBy as NonNullable<CustomerListParams["sortBy"]>,
    sortDirection: input.sortDirection,
  };
}

function createCustomerResource(
  mode: CustomerMode,
): ReadonlyResourceDeclaration<CustomerAggregate, CustomerFilters> {
  return defineReadonlyResource<CustomerAggregate, CustomerFilters>({
    key: mode === "history" ? "customer-history" : "customers",
    mode: "readonly",
    definition: customerDefinition(mode),
    initialFilters: {},
    selectedColumns: ["name", "phone", "price", "priceReturn", "orderCount", "latestOrderAt"],
    initialSort: { by: "latestOrderAt", direction: "desc" },
    viewPermission: PERMISSIONS.customersView,
    transport: {
      list(
        input: ResourceListInput<CustomerFilters>,
        signal?: AbortSignal,
      ): Promise<CustomerListResponse> {
        return customerService.list(mode, customerListParams(input), signal);
      },
    },
  });
}

export const currentCustomerResource = createCustomerResource("current");
export const historyCustomerResource = createCustomerResource("history");
