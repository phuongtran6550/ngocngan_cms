import {
  test as base,
  expect,
  type Locator,
  type Page,
  type Request,
  type Route,
} from "@playwright/test";

export const user = {
  id: "user-1",
  name: "Ngọc Châu",
  username: "admin",
  role: "ADMINISTRATOR",
  permissions: [],
};

export const categoryRows = [
  {
    id: "category-1",
    name: "Nhẫn",
    type: "category",
    status: "active",
    sortOrder: 0,
    usageCount: 3,
    updatedAt: "2026-07-26T00:00:00.000Z",
  },
];

export const catalogRows = {
  categories: categoryRows,
  materials: [
    {
      id: "material-1",
      name: "Vàng 18K",
      type: "material" as const,
      status: "active" as const,
      sortOrder: 0,
      usageCount: 3,
      updatedAt: "2026-07-26T00:00:00.000Z",
    },
  ],
  patterns: [
    {
      id: "pattern-1",
      name: "Bông mai",
      description: "Hoa năm cánh",
      skuCount: 3,
      createdBy: { id: user.id, name: user.name },
    },
  ],
};

export const categoryApiPattern = "**/api/categories**";
export const patternApiPattern = "**/api/patterns**";
export const catalogApiPatterns = ["**/api/categories**", "**/api/materials**"];
export const warehouseApiPattern = "**/api/warehoused-goods**";
export const sourceApiPattern = "**/api/source-of-goods**";
export const orderApiPattern = "**/api/orders**";
export const authApiPattern = "**/api/auth/**";
export const customerApiPattern = "**/api/customers**";
export const dashboardApiPattern = "**/api/dashboard/**";
export const exportApiPattern = "**/api/export/**";
export const roleApiPattern = "**/api/roles**";
export const userApiPattern = "**/api/users**";
export const settingsApiPattern = "**/api/settings**";
export const zaloApiPattern = "**/api/zalo**";

export async function openRowActions(
  page: Page,
  resourceLabel: string,
): Promise<void> {
  await page
    .getByRole("button", { name: `Thao tác với ${resourceLabel}` })
    .click();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5174",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Idempotency-Key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const productImage =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#eef2ff"/><circle cx="400" cy="400" r="220" fill="none" stroke="#3874ff" stroke-width="58"/><circle cx="400" cy="135" r="72" fill="#00b89c"/></svg>',
  );

interface MockOrderRow {
  id: string;
  name: string;
  phone: string;
  price: number;
  thumbnail: string;
  images: string[];
  status: "draft" | "completed" | "returned" | "cancelled";
  sell: boolean;
  isRemoved: boolean;
  createdBy: { id: string; name: string };
  items: Array<{
    id: string;
    categoryId: string | null;
    category: string;
    price: number;
  }>;
  returnedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const orderRows: MockOrderRow[] = [
  {
    id: "order-1",
    name: "Nguyễn Minh Anh",
    phone: "0909 111 222",
    price: 8_500_000,
    thumbnail: productImage,
    images: [productImage],
    status: "completed",
    sell: true,
    isRemoved: false,
    createdBy: { id: "user-1", name: "Ngọc Châu" },
    items: [
      {
        id: "line-1",
        categoryId: "category-1",
        category: "Nhẫn",
        price: 8_500_000,
      },
    ],
    createdAt: "2026-07-25T03:00:00.000Z",
    updatedAt: "2026-07-26T07:30:00.000Z",
  },
  {
    id: "order-2",
    name: "Phạm Thanh Hà",
    phone: "0918 222 333",
    price: 5_200_000,
    thumbnail: productImage,
    images: [productImage],
    status: "returned",
    sell: false,
    isRemoved: true,
    createdBy: { id: "user-1", name: "Ngọc Châu" },
    items: [
      {
        id: "line-2",
        categoryId: "category-2",
        category: "Vòng tay",
        price: 5_200_000,
      },
    ],
    returnedAt: "2026-07-26T08:00:00.000Z",
    createdAt: "2026-07-23T03:00:00.000Z",
    updatedAt: "2026-07-26T08:00:00.000Z",
  },
  {
    id: "order-3",
    name: "Võ Thùy Linh",
    phone: "0933 444 555",
    price: 3_400_000,
    thumbnail: productImage,
    images: [productImage],
    status: "cancelled",
    sell: false,
    isRemoved: true,
    createdBy: { id: "user-1", name: "Ngọc Châu" },
    items: [],
    cancelledAt: "2026-07-26T09:00:00.000Z",
    createdAt: "2026-07-22T03:00:00.000Z",
    updatedAt: "2026-07-26T09:00:00.000Z",
  },
  {
    id: "order-draft",
    name: "",
    phone: "",
    price: 0,
    thumbnail: productImage,
    images: [productImage],
    status: "draft",
    sell: true,
    isRemoved: false,
    createdBy: { id: "user-1", name: "Ngọc Châu" },
    items: [],
    createdAt: "2026-07-27T02:00:00.000Z",
    updatedAt: "2026-07-27T02:00:00.000Z",
  },
];

export const orderOptions = {
  categories: [
    { id: "category-1", name: "Nhẫn", type: "category" },
    { id: "category-2", name: "Vòng tay", type: "category" },
    { id: "category-3", name: "Mặt dây", type: "category" },
  ],
};

export const customerRows = [
  {
    id: "customer-1",
    name: "Nguyễn Minh Anh",
    phone: "0909 111 222",
    price: 8_500_000,
    priceReturn: 0,
    orderCount: 1,
    completedOrderCount: 1,
    returnedOrderCount: 0,
    latestOrderAt: "2026-07-25T03:00:00.000Z",
    firstOrderAt: "2026-07-25T03:00:00.000Z",
  },
];

export const customerHistoryRows = [
  {
    id: "customer-history-1",
    name: "Phạm Thanh Hà",
    phone: "0918 222 333",
    price: 0,
    priceReturn: 5_200_000,
    orderCount: 1,
    completedOrderCount: 0,
    returnedOrderCount: 1,
    latestOrderAt: "2026-07-26T08:00:00.000Z",
    firstOrderAt: "2026-07-23T03:00:00.000Z",
  },
];

export const permissionCatalog = {
  items: [
    { key: "dashboard.view", label: "Xem tổng quan", group: "Tổng quan" },
    { key: "orders.view", label: "Xem đơn hàng", group: "Đơn hàng" },
    { key: "orders.create", label: "Tạo đơn hàng", group: "Đơn hàng" },
    { key: "orders.update", label: "Cập nhật đơn hàng", group: "Đơn hàng" },
    { key: "orders.delete", label: "Hủy đơn hàng", group: "Đơn hàng" },
    { key: "users.manage", label: "Quản lý nhân sự", group: "Hệ thống" },
    { key: "roles.manage", label: "Quản lý vai trò", group: "Hệ thống" },
    { key: "zalo.manage", label: "Quản lý cài đặt", group: "Hệ thống" },
  ],
  groups: [
    { name: "Tổng quan", permissions: ["dashboard.view"] },
    {
      name: "Đơn hàng",
      permissions: [
        "orders.view",
        "orders.create",
        "orders.update",
        "orders.delete",
      ],
    },
    {
      name: "Hệ thống",
      permissions: ["users.manage", "roles.manage", "zalo.manage"],
    },
  ],
};

export const roleRows = [
  {
    id: "role-admin",
    name: "Quản trị viên",
    description: "Toàn quyền hệ thống",
    permissions: permissionCatalog.items.map((item) => item.key),
    systemRole: "ADMINISTRATOR" as const,
    isSystem: true,
    assignedUserCount: 1,
    createdAt: "2026-07-20T03:00:00.000Z",
    updatedAt: "2026-07-26T07:30:00.000Z",
  },
  {
    id: "role-sales",
    name: "Bán hàng",
    description: "Quản lý đơn bán hàng",
    permissions: ["orders.view", "orders.create", "orders.update"],
    systemRole: "USER" as const,
    isSystem: false,
    assignedUserCount: 1,
    createdAt: "2026-07-21T03:00:00.000Z",
    updatedAt: "2026-07-26T07:30:00.000Z",
  },
];

export const userRows = [
  {
    id: "user-1",
    name: "Ngọc Châu",
    username: "admin",
    role: "ADMINISTRATOR" as const,
    roleId: "role-admin",
    assignedRole: roleRows[0],
    permissions: permissionCatalog.items.map((item) => item.key),
    createdAt: "2026-07-20T03:00:00.000Z",
    updatedAt: "2026-07-26T07:30:00.000Z",
  },
  {
    id: "user-sales",
    name: "Nhân viên bán hàng",
    username: "sales01",
    role: "USER" as const,
    roleId: "role-sales",
    assignedRole: roleRows[1],
    permissions: ["orders.view", "orders.create", "orders.update"],
    createdAt: "2026-07-22T03:00:00.000Z",
    updatedAt: "2026-07-26T07:30:00.000Z",
  },
];

export const warehouseRows = [
  {
    id: "warehouse-1",
    code: "NC-001",
    name: "Nhẫn kim cương Aurora",
    supplier: { name: "Kim Hoàn Minh Anh", phone: "0909 123 456" },
    supplierName: "Kim Hoàn Minh Anh",
    supplierPhone: "0909 123 456",
    phone: "0909 123 456",
    thumbnail: productImage,
    images: [productImage],
    categoryId: "category-1",
    category: "Nhẫn",
    materialId: "material-1",
    material: "Vàng 18K",
    patternId: "pattern-1",
    pattern: "Bông mai",
    pricingType: "Đồ món",
    skus: [
      {
        id: "warehouse-1-sku-1",
        barcode: "100000000001",
        code: "NH-V18K-BM-1P25C-N12",
        size: "12",
        weight: 1.25,
        price: 6_700_000,
        laborCost: 0,
        platingCost: 0,
        importPrice: 4_200_000,
        stock: 4,
      },
      {
        id: "warehouse-1-sku-2",
        barcode: "100000000002",
        code: "NH-V18K-BM-1P4C-N14",
        size: "14",
        weight: 1.4,
        price: 650_000,
        laborCost: 0,
        platingCost: 0,
        importPrice: 350_000,
        stock: 2,
      },
    ],
    price: 6_700_000,
    laborCost: 0,
    platingCost: 0,
    importPrice: 4_200_000,
    weight: 1.25,
    size: "12",
    stock: 6,
    sold: 1,
    pending: 1,
    status: "active",
    createdBy: { id: "user-1", name: "Ngọc Châu" },
    createdAt: "2026-07-24T03:00:00.000Z",
    updatedAt: "2026-07-26T07:30:00.000Z",
  },
  {
    id: "warehouse-2",
    code: "NC-002",
    name: "Lắc tay Celeste",
    supplier: { name: "Kim Hoàn Minh Anh", phone: "0909 123 456" },
    supplierName: "Kim Hoàn Minh Anh",
    supplierPhone: "0909 123 456",
    phone: "0909 123 456",
    thumbnail: productImage,
    images: [productImage],
    categoryId: "category-2",
    category: "Lắc tay",
    materialId: "material-1",
    material: "Vàng 18K",
    patternId: "",
    pattern: "",
    pricingType: "Đồ cân",
    skus: [
      {
        id: "warehouse-2-sku-1",
        barcode: "100000000003",
        code: "LT-V18K-TR-2P1C-N17",
        size: "17",
        weight: 2.1,
        price: 10_500_000,
        laborCost: 500_000,
        platingCost: 100_000,
        importPrice: null,
        stock: 6,
      },
    ],
    price: 10_500_000,
    laborCost: 500_000,
    platingCost: 100_000,
    importPrice: 7_500_000,
    weight: 2.1,
    size: "17",
    stock: 6,
    sold: 2,
    pending: 0,
    status: "active",
    createdBy: { id: "user-1", name: "Ngọc Châu" },
    createdAt: "2026-07-22T03:00:00.000Z",
    updatedAt: "2026-07-25T07:30:00.000Z",
  },
  {
    id: "warehouse-3",
    code: "NC-003",
    name: "Mặt dây chuyền Luna",
    supplier: { name: "Đá Quý Phương Nam", phone: "0918 222 333" },
    supplierName: "Đá Quý Phương Nam",
    supplierPhone: "0918 222 333",
    phone: "0918 222 333",
    thumbnail: productImage,
    images: [productImage],
    categoryId: "category-3",
    category: "Mặt dây",
    materialId: "material-2",
    material: "Bạc 925",
    patternId: "",
    pattern: "",
    pricingType: "Đồ hột",
    skus: [
      {
        id: "warehouse-3-sku-1",
        barcode: "100000000004",
        code: "MD-B925-TR-0P8C-FREE",
        size: "Free size",
        weight: 0.8,
        price: 5_500_000,
        laborCost: 350_000,
        platingCost: 80_000,
        importPrice: 3_000_000,
        stock: 3,
      },
    ],
    price: 5_500_000,
    laborCost: 350_000,
    platingCost: 80_000,
    importPrice: 3_000_000,
    weight: 0.8,
    size: "Free size",
    stock: 3,
    sold: 0,
    pending: 1,
    status: "inactive",
    createdBy: { id: "user-1", name: "Ngọc Châu" },
    createdAt: "2026-07-20T03:00:00.000Z",
    updatedAt: "2026-07-23T07:30:00.000Z",
  },
];

export const warehouseOptions = {
  categories: [
    { id: "category-1", name: "Nhẫn", type: "category" },
    { id: "category-2", name: "Lắc tay", type: "category" },
    { id: "category-3", name: "Mặt dây", type: "category" },
  ],
  materials: [
    { id: "material-1", name: "Vàng 18K", type: "material" },
    { id: "material-2", name: "Bạc 925", type: "material" },
  ],
  patterns: [{ id: "pattern-1", name: "Bông mai", type: "pattern" }],
  silverPrice: 220_000,
};

interface CategoryApiOptions {
  deleteInUse?: boolean;
  failList?: boolean;
}

export async function mockCategoryApi(
  page: Page,
  options: CategoryApiOptions = {},
) {
  const rows = Object.fromEntries(
    ["categories", "materials"].map((key) => [
      key,
      catalogRows[key as "categories" | "materials"].map((row) => ({
        ...row,
        // Simulate a concurrent usage change after the list was loaded.
        usageCount:
          options.deleteInUse && key === "categories" ? 0 : row.usageCount,
      })),
    ]),
  ) as Record<"categories" | "materials", Array<Record<string, unknown>>>;
  const handler = async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const resource = url.pathname
      .split("/")
      .filter(Boolean)[1] as keyof typeof rows;
    const resourceRows = rows[resource];

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (method === "GET") {
      if (options.failList) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Lỗi hệ thống",
            code: "INTERNAL_SERVER_ERROR",
          }),
        });
        return;
      }
      const items = resourceRows;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          items,
          page: 1,
          limit: 20,
          total: items.length,
          totalPages: items.length ? 1 : 0,
        }),
      });
      return;
    }

    if (method === "POST") {
      const input = request.postDataJSON();
      const type = resource === "categories" ? "category" : "material";
      const item = {
        id: `${type}-${resourceRows.length + 1}`,
        type,
        usageCount: 0,
        updatedAt: new Date().toISOString(),
        ...input,
      };
      resourceRows.push(item);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ item }),
      });
      return;
    }

    const id = url.pathname.split("/").pop();
    if (method === "PATCH") {
      const input = request.postDataJSON();
      const index = resourceRows.findIndex((row) => row.id === id);
      if (index >= 0)
        resourceRows[index] = {
          ...resourceRows[index],
          ...input,
          updatedAt: new Date().toISOString(),
        };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ item: resourceRows[index] }),
      });
      return;
    }

    if (method === "DELETE" && options.deleteInUse) {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Danh mục đang được sử dụng và không thể xóa",
          code: "CATEGORY_IN_USE",
          errors: { usageCount: 3 },
        }),
      });
      return;
    }

    if (method === "DELETE") {
      const index = resourceRows.findIndex((row) => row.id === id);
      if (index >= 0) resourceRows.splice(index, 1);
      await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
    }
  };
  await Promise.all(
    catalogApiPatterns.map((pattern) => page.route(pattern, handler)),
  );
  return rows;
}

interface PatternApiOptions {
  failList?: boolean;
  deleteInUse?: boolean;
}

export async function mockPatternApi(
  page: Page,
  options: PatternApiOptions = {},
) {
  const rows = catalogRows.patterns.map((row) => ({
    ...row,
    createdBy: { ...row.createdBy },
  }));
  const writes: Array<{ method: string; body: Record<string, unknown> }> = [];

  await page.route(patternApiPattern, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const isCollection = url.pathname.endsWith("/patterns");

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (method === "GET" && isCollection) {
      if (options.failList) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Lỗi hệ thống",
            code: "INTERNAL_SERVER_ERROR",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          items: rows,
          page: 1,
          limit: 20,
          total: rows.length,
          totalPages: rows.length ? 1 : 0,
        }),
      });
      return;
    }

    if (method === "POST" && isCollection) {
      const input = request.postDataJSON() as Record<string, unknown>;
      const body = {
        name: String(input.name || ""),
        description: String(input.description || ""),
      };
      if (!body.name.trim()) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Tên mẫu là bắt buộc",
            code: "VALIDATION_ERROR",
          }),
        });
        return;
      }
      writes.push({ method, body });
      const item = {
        id: `pattern-${rows.length + 1}`,
        ...body,
        skuCount: 0,
        createdBy: { id: user.id, name: user.name },
      };
      rows.push(item);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ item }),
      });
      return;
    }

    const id = url.pathname.split("/").filter(Boolean).at(-1) || "";
    const index = rows.findIndex((row) => row.id === id);
    if (method === "PATCH") {
      const input = request.postDataJSON() as Record<string, unknown>;
      const body = {
        name: String(input.name || ""),
        description: String(input.description || ""),
      };
      writes.push({ method, body });
      if (index >= 0) rows[index] = { ...rows[index], ...body };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ item: rows[index] }),
      });
      return;
    }

    if (method === "DELETE" && options.deleteInUse) {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Mẫu đang được sử dụng bởi 1 sản phẩm nên không thể xóa",
          code: "PATTERN_IN_USE",
          errors: { usageCount: 1 },
        }),
      });
      return;
    }

    if (method === "DELETE") {
      if (index >= 0) rows.splice(index, 1);
      await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
    }
  });

  return { items: rows, writes };
}

interface WarehouseApiOptions {
  empty?: boolean;
  failList?: boolean;
  failDetail?: boolean;
  failSave?: boolean;
  saveErrors?: Record<string, string>;
  failDelete?: boolean;
  delayMs?: number;
}

interface SourceApiOptions {
  empty?: boolean;
  failList?: boolean;
  delayMs?: number;
  warehouseRows?: typeof warehouseRows;
}

interface OrderApiOptions {
  empty?: boolean;
  failList?: boolean;
  failDetail?: boolean;
  failSave?: boolean;
  delayMs?: number;
}

function cloneWarehouseRows(): typeof warehouseRows {
  return warehouseRows.map((row) => ({
    ...row,
    supplier: { ...row.supplier },
    images: [...row.images],
    skus: row.skus.map((sku) => ({ ...sku })),
    createdBy: { ...row.createdBy },
  }));
}

function multipartFields(request: Request): Record<string, string> {
  const contentType = request.headers()["content-type"] || "";
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i
    .exec(contentType)
    ?.slice(1)
    .find(Boolean);
  const body = request.postDataBuffer()?.toString("utf8") || "";
  if (!boundary || !body) return {};

  return body
    .split(`--${boundary}`)
    .reduce<Record<string, string>>((fields, part) => {
      const separator = part.indexOf("\r\n\r\n");
      if (separator < 0) return fields;
      const headers = part.slice(0, separator);
      if (/filename="/i.test(headers)) return fields;
      const name = /name="([^"]+)"/i.exec(headers)?.[1];
      if (!name) return fields;
      fields[name] = part.slice(separator + 4).replace(/\r\n$/, "");
      return fields;
    }, {});
}

function cloneOrderRows(): MockOrderRow[] {
  return orderRows.map((row) => ({
    ...row,
    images: [...row.images],
    createdBy: { ...row.createdBy },
    items: row.items.map((item) => ({ ...item })),
  }));
}

function completeOrder(row: MockOrderRow): boolean {
  return Boolean(row.name.trim() && row.phone.trim() && row.price > 0);
}

export async function mockOrderApi(page: Page, options: OrderApiOptions = {}) {
  const rows = cloneOrderRows();
  const counters = {
    create: 0,
    update: 0,
    thumbnail: 0,
    returned: 0,
    cancelled: 0,
  };
  const writeKeys: string[] = [];

  await page.route(orderApiPattern, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const segments = url.pathname.split("/").filter(Boolean);
    const isCollection = url.pathname.endsWith("/orders");
    const isOptions = url.pathname.endsWith("/orders/options");
    const isMissing = url.pathname.endsWith("/orders/missing-info");
    const isThumbnail = url.pathname.endsWith("/thumbnail");
    const isReturn = url.pathname.endsWith("/mark-returned");
    const id =
      isThumbnail || isReturn ? segments.at(-2) || "" : segments.at(-1) || "";

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (options.delayMs)
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    if (["POST", "PATCH", "DELETE"].includes(method)) {
      writeKeys.push(request.headers()["idempotency-key"] || "");
    }

    if (method === "GET" && isOptions) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify(orderOptions),
      });
      return;
    }

    if (method === "GET" && isMissing) {
      const items = options.empty
        ? []
        : rows.filter((row) => row.status === "draft");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          items,
          page: 1,
          limit: 12,
          total: items.length,
          totalPages: items.length ? 1 : 0,
        }),
      });
      return;
    }

    if (method === "GET" && isCollection) {
      if (options.failList) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể tải đơn hàng",
            code: "ORDER_LIST_FAILED",
          }),
        });
        return;
      }
      const query = (url.searchParams.get("query") || "")
        .trim()
        .toLocaleLowerCase("vi-VN");
      const status = url.searchParams.get("status") || "";
      const type = url.searchParams.get("type") || "";
      const items = options.empty
        ? []
        : rows.filter((row) => {
            const listed = row.status !== "draft";
            const searchable = `${row.name} ${row.phone}`.toLocaleLowerCase(
              "vi-VN",
            );
            const typeMatches =
              !type ||
              (type === "1"
                ? row.status === "completed"
                : row.status === "returned");
            return (
              listed &&
              (!query || searchable.includes(query)) &&
              (!status || row.status === status) &&
              typeMatches
            );
          });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          items,
          page: 1,
          limit: 20,
          total: items.length,
          totalPages: items.length ? 1 : 0,
        }),
      });
      return;
    }

    if (method === "POST" && isCollection) {
      if (options.failSave) {
        await route.fulfill({
          status: 422,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể tạo đơn nháp",
            code: "ORDER_CREATE_FAILED",
          }),
        });
        return;
      }
      counters.create += 1;
      const now = new Date().toISOString();
      const order: MockOrderRow = {
        id: "order-new",
        name: "",
        phone: "",
        price: 0,
        thumbnail: productImage,
        images: [productImage],
        status: "draft",
        sell: true,
        isRemoved: false,
        createdBy: { ...user },
        items: [],
        createdAt: now,
        updatedAt: now,
      };
      rows.unshift(order);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ order }),
      });
      return;
    }

    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Không tìm thấy đơn hàng",
          code: "ORDER_NOT_FOUND",
        }),
      });
      return;
    }

    if (method === "PATCH" && isThumbnail) {
      counters.thumbnail += 1;
      rows[index] = {
        ...rows[index],
        thumbnail: productImage,
        images: [productImage, ...rows[index].images],
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ order: rows[index] }),
      });
      return;
    }

    if (method === "POST" && isReturn) {
      counters.returned += 1;
      rows[index] = {
        ...rows[index],
        status: "returned",
        sell: false,
        isRemoved: true,
        returnedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ order: rows[index] }),
      });
      return;
    }

    if (method === "GET") {
      if (options.failDetail) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể tải chi tiết đơn hàng",
            code: "ORDER_DETAIL_FAILED",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ order: rows[index] }),
      });
      return;
    }

    if (method === "PATCH") {
      if (options.failSave) {
        await route.fulfill({
          status: 422,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Dữ liệu đơn hàng chưa hợp lệ",
            code: "ORDER_UPDATE_FAILED",
          }),
        });
        return;
      }
      counters.update += 1;
      const input = request.postDataJSON() as Partial<MockOrderRow>;
      const next = {
        ...rows[index],
        ...input,
        price:
          input.price === undefined
            ? rows[index].price
            : Number(input.price) || 0,
        items: Array.isArray(input.items)
          ? input.items.map((item, itemIndex) => ({
              ...item,
              id: item.id || `line-${itemIndex + 1}`,
            }))
          : rows[index].items,
        updatedAt: new Date().toISOString(),
      } as MockOrderRow;
      if (next.status === "draft" && completeOrder(next))
        next.status = "completed";
      rows[index] = next;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ order: rows[index] }),
      });
      return;
    }

    if (method === "DELETE") {
      counters.cancelled += 1;
      rows[index] = {
        ...rows[index],
        status: "cancelled",
        isRemoved: true,
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
    }
  });

  return { items: rows, counters, writeKeys };
}

function updateWarehouseItem(
  item: (typeof warehouseRows)[number],
  fields: Record<string, string>,
): (typeof warehouseRows)[number] {
  const numberFields = [
    "price",
    "laborCost",
    "platingCost",
    "importPrice",
    "weight",
    "stock",
    "sold",
    "pending",
  ] as const;
  const updated = { ...item, supplier: { ...item.supplier } };

  Object.entries(fields).forEach(([key, value]) => {
    if ((numberFields as readonly string[]).includes(key)) {
      Object.assign(updated, { [key]: Number(value) || 0 });
      return;
    }
    Object.assign(updated, { [key]: value });
  });

  updated.supplierName = fields.supplierName ?? updated.supplierName;
  updated.supplierPhone = fields.supplierPhone ?? updated.supplierPhone;
  updated.phone = updated.supplierPhone;
  updated.supplier = {
    name: updated.supplierName,
    phone: updated.supplierPhone,
  };
  updated.category =
    warehouseOptions.categories.find(
      (option) => option.id === updated.categoryId,
    )?.name || "";
  updated.material =
    warehouseOptions.materials.find(
      (option) => option.id === updated.materialId,
    )?.name || "";
  updated.pattern =
    warehouseOptions.patterns.find((option) => option.id === updated.patternId)
      ?.name || "";
  if (fields.skus) {
    try {
      const parsed = JSON.parse(fields.skus) as Array<Record<string, unknown>>;
      if (Array.isArray(parsed)) {
        updated.skus = parsed.map((sku, index) => ({
          id: `${updated.id}-sku-${index + 1}`,
          barcode:
            item.skus[index]?.barcode ||
            String(100_000_000_001 + index).padStart(12, "0"),
          code: String(sku.code || ""),
          size: String(sku.size || ""),
          weight: Number(sku.weight) || 0,
          price: Number(sku.price) || 0,
          laborCost: Number(sku.laborCost) || 0,
          platingCost: Number(sku.platingCost) || 0,
          importPrice:
            sku.importPrice === null ? null : Number(sku.importPrice) || 0,
          stock: Number(sku.stock) || 0,
        }));
        updated.code = updated.skus[0]?.code || updated.code;
        updated.stock = updated.skus.reduce(
          (total, sku) => total + sku.stock,
          0,
        );
      }
    } catch {
      // Invalid payloads are covered by API validation tests, not this browser fixture.
    }
  }
  updated.updatedAt = new Date().toISOString();
  return updated;
}

function normalizeMockSkuCode(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function mockSkuCodeBase(value: string): string {
  return normalizeMockSkuCode(value).replace(/-\d{2,}$/, "");
}

function allocateMockSkuCodes(
  requestedCodes: string[],
  existingCodes: string[],
) {
  const used = new Set(existingCodes.map(normalizeMockSkuCode).filter(Boolean));
  return requestedCodes.map((value) => {
    const requested = normalizeMockSkuCode(value);
    if (!used.has(requested)) {
      used.add(requested);
      return requested;
    }
    const base = mockSkuCodeBase(requested);
    for (let suffix = 2; suffix <= 999999; suffix += 1) {
      const ending = `-${String(suffix).padStart(2, "0")}`;
      const candidate = `${base.slice(0, 100 - ending.length).replace(/-+$/, "")}${ending}`;
      if (!used.has(candidate)) {
        used.add(candidate);
        return candidate;
      }
    }
    return requested;
  });
}

export async function mockWarehouseApi(
  page: Page,
  options: WarehouseApiOptions = {},
) {
  const rows = cloneWarehouseRows();
  await page.route(warehouseApiPattern, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const isCollection = url.pathname.endsWith("/warehoused-goods");
    const isOptions = url.pathname.endsWith("/warehoused-goods/options");
    const isSkuCodeCheck = url.pathname.endsWith(
      "/warehoused-goods/sku-codes/check",
    );
    const isPrintLabel = /\/warehoused-goods\/[^/]+\/skus\/[^/]+\/print-label$/.test(
      url.pathname,
    );
    const id = url.pathname.split("/").filter(Boolean).at(-1) || "";

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (options.delayMs)
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));

    if (method === "GET" && isOptions) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify(warehouseOptions),
      });
      return;
    }

    if (method === "GET" && isCollection) {
      if (options.failList) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể tải sản phẩm",
            code: "INVENTORY_LIST_FAILED",
          }),
        });
        return;
      }
      const query = (url.searchParams.get("query") || "")
        .trim()
        .toLocaleLowerCase("vi-VN");
      const categoryId = url.searchParams.get("categoryId") || "";
      const materialId = url.searchParams.get("materialId") || "";
      const pricingType = url.searchParams.get("pricingType") || "";
      const status = url.searchParams.get("status") || "";
      const items = options.empty
        ? []
        : rows.filter((row) => {
            const searchable = [
              row.name,
              row.code,
              row.supplierName,
              row.supplierPhone,
              ...row.skus.map((sku) => sku.code),
            ]
              .join(" ")
              .toLocaleLowerCase("vi-VN");
            return (
              (!query || searchable.includes(query)) &&
              (!categoryId || row.categoryId === categoryId) &&
              (!materialId || row.materialId === materialId) &&
              (!pricingType || row.pricingType === pricingType) &&
              (!status || row.status === status)
            );
          });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          items,
          page: 1,
          limit: 20,
          total: items.length,
          totalPages: items.length ? 1 : 0,
        }),
      });
      return;
    }

    if (method === "POST" && isSkuCodeCheck) {
      const body = request.postDataJSON() as {
        skus?: Array<{ code?: string }>;
      };
      const skus = Array.isArray(body.skus) ? body.skus : [];
      const requestedCodes = skus.map((sku) => normalizeMockSkuCode(sku.code));
      const existingCodes = rows.flatMap((row) =>
        row.skus.map((sku) => sku.code),
      );
      const allocatedCodes = allocateMockSkuCodes(
        requestedCodes,
        existingCodes,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          items: skus.map((_, index) => ({ code: allocatedCodes[index] })),
        }),
      });
      return;
    }

    if (method === "POST" && isPrintLabel) {
      const body = request.postDataJSON() as { quantity?: number };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          queued: true,
          printer: "Godex_G500",
          jobId: "Godex_G500-25",
          quantity: Number(body.quantity) || 1,
        }),
      });
      return;
    }

    if (method === "GET") {
      if (options.failDetail) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể tải chi tiết sản phẩm",
            code: "INVENTORY_DETAIL_FAILED",
          }),
        });
        return;
      }
      const item = rows.find((row) => row.id === id);
      await route.fulfill({
        status: item ? 200 : 404,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify(
          item
            ? { status: "success", detail: item }
            : { message: "Không tìm thấy sản phẩm", code: "NOT_FOUND" },
        ),
      });
      return;
    }

    if (
      (method === "POST" || method === "PATCH") &&
      (options.failSave || options.saveErrors)
    ) {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Dữ liệu sản phẩm chưa hợp lệ",
          code: "VALIDATION_ERROR",
          ...(options.saveErrors ? { errors: options.saveErrors } : {}),
        }),
      });
      return;
    }

    if (method === "POST" && isCollection) {
      const fields = multipartFields(request);
      const seed = {
        ...rows[0],
        id: `warehouse-${rows.length + 1}`,
        createdAt: new Date().toISOString(),
      };
      const item = updateWarehouseItem(seed, fields);
      rows.unshift(item);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ status: "success", detail: item }),
      });
      return;
    }

    if (method === "PATCH") {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không tìm thấy sản phẩm",
            code: "NOT_FOUND",
          }),
        });
        return;
      }
      rows[index] = updateWarehouseItem(rows[index], multipartFields(request));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ status: "success", detail: rows[index] }),
      });
      return;
    }

    if (method === "DELETE" && options.failDelete) {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Sản phẩm đang được sử dụng",
          code: "INVENTORY_IN_USE",
        }),
      });
      return;
    }

    if (method === "DELETE") {
      const index = rows.findIndex((row) => row.id === id);
      if (index >= 0) rows.splice(index, 1);
      await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
    }
  });
  return { items: rows };
}

function aggregateSources(rows: typeof warehouseRows) {
  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      phone: string;
      itemCount: number;
      totalImportValue: number;
      price: number;
      latestImportAt?: string;
    }
  >();

  rows.forEach((row) => {
    const key = row.supplierPhone || row.supplierName;
    const current = grouped.get(key) || {
      id: `source-${grouped.size + 1}`,
      name: row.supplierName,
      phone: row.supplierPhone,
      itemCount: 0,
      totalImportValue: 0,
      price: 0,
      latestImportAt: row.updatedAt,
    };
    current.itemCount += 1;
    current.totalImportValue += row.importPrice;
    current.price = current.totalImportValue;
    if (!current.latestImportAt || row.updatedAt > current.latestImportAt)
      current.latestImportAt = row.updatedAt;
    grouped.set(key, current);
  });

  return [...grouped.values()];
}

export async function mockSourceApi(
  page: Page,
  options: SourceApiOptions = {},
) {
  const inventoryRows = options.warehouseRows || cloneWarehouseRows();
  await page.route(sourceApiPattern, async (route) => {
    const request = route.request();
    const method = request.method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (options.delayMs)
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    if (options.failList) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Không thể tải nguồn hàng",
          code: "SOURCE_LIST_FAILED",
        }),
      });
      return;
    }
    const url = new URL(request.url());
    const query = (url.searchParams.get("query") || "")
      .trim()
      .toLocaleLowerCase("vi-VN");
    const items = options.empty
      ? []
      : aggregateSources(inventoryRows).filter((item) =>
          [item.name, item.phone]
            .join(" ")
            .toLocaleLowerCase("vi-VN")
            .includes(query),
        );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({
        items,
        page: 1,
        limit: 20,
        total: items.length,
        totalPages: items.length ? 1 : 0,
      }),
    });
  });
  return inventoryRows;
}

export async function mockAuthApi(page: Page, storedUser: typeof user = user) {
  await page.route(authApiPattern, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method === "POST" && url.pathname.endsWith("/auth/login")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ token: "e2e-token", user: storedUser }),
      });
      return;
    }
    if (method === "GET" && url.pathname.endsWith("/auth/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ user: storedUser }),
      });
      return;
    }
    if (method === "POST" && url.pathname.endsWith("/auth/change-password")) {
      await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Không tìm thấy auth route",
        code: "NOT_FOUND",
      }),
    });
  });
}

export async function mockDashboardApi(
  page: Page,
  options: { failOverview?: boolean } = {},
) {
  await page.route(dashboardApiPattern, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (options.failOverview) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Không thể tải tổng quan",
          code: "DASHBOARD_FAILED",
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({
        period: {
          timezone: "Asia/Ho_Chi_Minh",
          currentStart: "2026-06-28T00:00:00.000+07:00",
          end: "2026-07-27T23:59:59.999+07:00",
        },
        kpis: {
          salesRevenue: {
            value: 8_500_000,
            previousValue: 5_000_000,
            changePercent: 70,
          },
          netRevenue: {
            value: 3_300_000,
            previousValue: 2_000_000,
            changePercent: 65,
          },
          returnValue: {
            value: 5_200_000,
            previousValue: 0,
            changePercent: 100,
          },
          todayOrders: { value: 1, previousValue: 0, changePercent: 100 },
          newCustomers: { value: 2, previousValue: 1, changePercent: 100 },
          inventoryCount: {
            value: warehouseRows.length,
            previousValue: 2,
            changePercent: 50,
          },
          inventoryValue: {
            value: 23_000_000,
            previousValue: 15_000_000,
            changePercent: 53,
          },
        },
        dailySeries: [
          {
            date: "2026-07-27",
            sales: 8_500_000,
            returns: 5_200_000,
            net: 3_300_000,
            orders: 2,
          },
        ],
        transactionMix: { completed: 1, returned: 1, cancelled: 1 },
        alerts: [
          {
            key: "draft-orders",
            title: "Đơn chờ bổ sung",
            value: 1,
            path: "/orders/missing",
          },
        ],
        topCustomers: customerRows.map((row) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          value: row.price,
          orders: row.orderCount,
        })),
        topSources: [
          {
            id: "source-1",
            name: "Kim Hoàn Minh Anh",
            phone: "0909 123 456",
            value: 20_000_000,
            items: 2,
          },
        ],
        highValueInventory: warehouseRows.map((row) => ({
          id: row.id,
          name: row.name,
          code: row.code,
          thumbnail: row.thumbnail,
          importPrice: row.importPrice,
          stock: row.stock,
        })),
        recentOrders: orderRows
          .filter((row) => row.status !== "draft")
          .map((row) => ({
            id: row.id,
            name: row.name,
            phone: row.phone,
            price: row.price,
            status: row.status,
            thumbnail: row.thumbnail,
            createdAt: row.createdAt,
          })),
      }),
    });
  });

  await page.route(exportApiPattern, async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "text/csv",
      headers: {
        ...corsHeaders,
        "Content-Disposition": 'attachment; filename="orders.csv"',
      },
      body: "Mã đơn,Khách hàng\norder-1,Nguyễn Minh Anh\n",
    });
  });
}

export async function mockCustomerApi(
  page: Page,
  options: { failList?: boolean } = {},
) {
  await page.route(customerApiPattern, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (options.failList) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Không thể tải khách hàng",
          code: "CUSTOMER_LIST_FAILED",
        }),
      });
      return;
    }
    const history = url.pathname.endsWith("/customers/history");
    const rows = history ? customerHistoryRows : customerRows;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({
        items: rows,
        page: 1,
        limit: 20,
        total: rows.length,
        totalPages: rows.length ? 1 : 0,
      }),
    });
  });
}

export async function mockRoleApi(
  page: Page,
  options: { failList?: boolean } = {},
) {
  const rows = roleRows.map((row) => ({
    ...row,
    permissions: [...row.permissions],
  }));
  await page.route(roleApiPattern, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method === "GET" && url.pathname.endsWith("/roles/permissions")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify(permissionCatalog),
      });
      return;
    }
    if (method === "GET" && url.pathname.endsWith("/roles/options")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          status: "success",
          data: rows.map((row) => ({ id: row.id, name: row.name })),
        }),
      });
      return;
    }
    if (method === "GET" && url.pathname.endsWith("/roles")) {
      if (options.failList) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể tải vai trò",
            code: "ROLE_LIST_FAILED",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          items: rows,
          page: 1,
          limit: 20,
          total: rows.length,
          totalPages: 1,
        }),
      });
      return;
    }
    if (method === "POST") {
      const input = request.postDataJSON();
      const item = {
        ...rows[1],
        id: `role-${rows.length + 1}`,
        isSystem: false,
        assignedUserCount: 0,
        ...input,
      };
      rows.push(item);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ item }),
      });
      return;
    }
    const id = url.pathname.split("/").filter(Boolean).at(-1) || "";
    if (method === "PATCH") {
      const input = request.postDataJSON();
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không tìm thấy vai trò",
            code: "ROLE_NOT_FOUND",
          }),
        });
        return;
      }
      rows[index] = {
        ...rows[index],
        ...input,
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ item: rows[index] }),
      });
      return;
    }
    if (method === "DELETE") {
      const index = rows.findIndex((row) => row.id === id);
      if (index >= 0) rows.splice(index, 1);
      await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
      return;
    }
    await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
  });
}

export async function mockUserApi(
  page: Page,
  options: { failList?: boolean; failCreateDuplicate?: boolean } = {},
) {
  const rows = userRows.map((row) => ({
    ...row,
    permissions: [...row.permissions],
    assignedRole: row.assignedRole ? { ...row.assignedRole } : null,
  }));
  const assignedRoleFor = (roleId: string | null | undefined) =>
    roleRows.find((role) => role.id === roleId) || null;
  await page.route(userApiPattern, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method === "GET" && url.pathname.endsWith("/users/permissions")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify(permissionCatalog),
      });
      return;
    }
    if (method === "GET" && url.pathname.endsWith("/users")) {
      if (options.failList) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể tải nhân sự",
            code: "USER_LIST_FAILED",
          }),
        });
        return;
      }
      const role = url.searchParams.get("role");
      const items = role ? rows.filter((row) => row.role === role) : rows;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          items,
          page: 1,
          limit: 20,
          total: items.length,
          totalPages: items.length ? 1 : 0,
        }),
      });
      return;
    }
    if (method === "POST") {
      if (options.failCreateDuplicate) {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Tài khoản này đã tồn tại",
            code: "USER_ALREADY_EXISTS",
          }),
        });
        return;
      }
      const input = request.postDataJSON();
      const assignedRole = assignedRoleFor(input.roleId) || roleRows[1];
      const { password: _password, ...publicInput } = input;
      const item = {
        ...rows[1],
        id: `user-${rows.length + 1}`,
        ...publicInput,
        assignedRole,
        permissions: assignedRole.permissions || [],
      };
      rows.push(item);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ item }),
      });
      return;
    }
    const id = url.pathname.split("/").filter(Boolean).at(-1) || "";
    if (method === "PATCH") {
      const input = request.postDataJSON();
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không tìm thấy nhân sự",
            code: "USER_NOT_FOUND",
          }),
        });
        return;
      }
      const { password: _password, ...publicInput } = input;
      const assignedRole =
        input.roleId === undefined
          ? rows[index].assignedRole
          : assignedRoleFor(input.roleId);
      rows[index] = {
        ...rows[index],
        ...publicInput,
        assignedRole,
        permissions: assignedRole?.permissions || [],
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ item: rows[index] }),
      });
      return;
    }
    if (method === "DELETE") {
      const index = rows.findIndex((row) => row.id === id);
      if (index >= 0) rows.splice(index, 1);
      await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
      return;
    }
    await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
  });
}

export async function mockSettingsApi(
  page: Page,
  options: { failStatus?: boolean; failApply?: boolean } = {},
) {
  let silverPrice = 220_000;
  const weightedProductCount = 3;

  await page.route(settingsApiPattern, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (!url.pathname.endsWith("/settings/silver-price")) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          message: "Không tìm thấy cài đặt",
          code: "NOT_FOUND",
        }),
      });
      return;
    }
    if (method === "GET") {
      if (options.failStatus) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể tải giá bạc",
            code: "SILVER_PRICE_STATUS_FAILED",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          silverPrice,
          weightedProductCount,
          updatedAt: "2026-07-31T04:30:00.000Z",
          updatedBy: "user-1",
        }),
      });
      return;
    }
    if (method === "PUT") {
      if (options.failApply) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể áp dụng thay đổi giá bạc",
            code: "SILVER_PRICE_APPLY_FAILED",
          }),
        });
        return;
      }
      const previousSilverPrice = silverPrice;
      silverPrice = Number(request.postDataJSON().silverPrice);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          previousSilverPrice,
          silverPrice,
          updatedCount: weightedProductCount,
          updatedAt: "2026-07-31T04:35:00.000Z",
          updatedBy: "user-1",
        }),
      });
      return;
    }
    await route.fulfill({
      status: 405,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Phương thức không được hỗ trợ",
        code: "METHOD_NOT_ALLOWED",
      }),
    });
  });
}

export async function mockZaloApi(
  page: Page,
  options: {
    failStatus?: boolean;
    failCallback?: boolean;
    state?: "disconnected" | "connected" | "expired_access" | "expired_refresh";
  } = {},
) {
  let state = options.state || "connected";
  const status = () => ({
    configured: true,
    connected: state === "connected" || state === "expired_access",
    state,
    oa:
      state === "disconnected"
        ? null
        : { id: "oa-1", name: "Ngọc Châu OA", avatar: "" },
    connectedAt: state === "disconnected" ? null : "2026-07-26T07:30:00.000Z",
    connectedBy: state === "disconnected" ? "" : "Ngọc Châu",
    accessExpiresAt:
      state === "disconnected" ? null : "2026-07-27T07:30:00.000Z",
    refreshExpiresAt:
      state === "expired_refresh"
        ? "2026-07-20T07:30:00.000Z"
        : "2026-08-26T07:30:00.000Z",
    lastRefreshedAt: "2026-07-26T07:30:00.000Z",
    pendingStateExpiresAt: null,
    reconnectRequired: state === "expired_refresh",
    retryAfterSeconds: 0,
  });
  await page.route(zaloApiPattern, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (method === "GET" && url.pathname.endsWith("/zalo/status")) {
      if (options.failStatus) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Không thể tải trạng thái Zalo OA",
            code: "ZALO_STATUS_FAILED",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify(status()),
      });
      return;
    }
    if (method === "GET" && url.pathname.endsWith("/zalo/auth-url")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          url: "https://oauth.zaloapp.com/connect",
          stateExpiresAt: "2026-07-27T07:35:00.000Z",
        }),
      });
      return;
    }
    if (method === "POST" && url.pathname.endsWith("/zalo/callback")) {
      if (options.failCallback) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          headers: corsHeaders,
          body: JSON.stringify({
            message: "Callback Zalo không hợp lệ",
            code: "ZALO_CALLBACK_FAILED",
          }),
        });
        return;
      }
      state = "connected";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify(status()),
      });
      return;
    }
    if (method === "DELETE" && url.pathname.endsWith("/zalo/disconnect")) {
      state = "disconnected";
      await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
    }
  });
}

export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

export async function ensureTableView(page: Page): Promise<Locator> {
  await page.waitForLoadState("networkidle");
  const table = page.getByTestId("desktop-data-table");
  if (!(await table.isVisible())) {
    await page.getByTestId("view-mode-table").click();
    await expect(table).toBeVisible();
  }
  return table;
}

async function setupCmsPage(
  page: Page,
  storedUser: typeof user,
): Promise<void> {
  await page.addInitScript(
    ({ token, storedUser }) => {
      localStorage.setItem("ngocchau.cms2.token", token);
      localStorage.setItem("ngocchau.cms2.user", JSON.stringify(storedUser));
      localStorage.setItem("ngocchau.theme", "light");
    },
    { token: "e2e-token", storedUser },
  );

  await mockAuthApi(page, storedUser);
  await mockDashboardApi(page);
  await mockCustomerApi(page);
  await mockRoleApi(page);
  await mockUserApi(page);
  await mockSettingsApi(page);
  await mockZaloApi(page);
  await mockCategoryApi(page);
  await mockPatternApi(page);
  const inventory = await mockWarehouseApi(page);
  await mockSourceApi(page, { warehouseRows: inventory.items });
  await mockOrderApi(page);
}

export const test = base.extend<{
  authenticatedPage: Page;
  readOnlyPage: Page;
  noPermissionPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await setupCmsPage(page, user);
    await use(page);
  },
  readOnlyPage: async ({ page }, use) => {
    await setupCmsPage(page, {
      ...user,
      id: "viewer-1",
      name: "Người xem",
      username: "viewer",
      role: "USER",
      permissions: ["orders.view"],
    });
    await use(page);
  },
  noPermissionPage: async ({ page }, use) => {
    await setupCmsPage(page, {
      ...user,
      id: "limited-1",
      name: "Không quyền",
      username: "limited",
      role: "USER",
      permissions: [],
    });
    await use(page);
  },
});

export { expect };
