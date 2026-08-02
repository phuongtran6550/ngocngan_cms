import { createServer } from "node:http";

const port = Number(process.env.CMS2_BROWSER_MOCK_PORT || 4100);
const cors = {
  "Access-Control-Allow-Origin": "http://localhost:5174",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};
const image =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#eef2ff"/><circle cx="400" cy="400" r="220" fill="none" stroke="#3874ff" stroke-width="58"/><circle cx="400" cy="135" r="72" fill="#00b89c"/></svg>',
  );
const user = {
  id: "browser-user",
  name: "Ngọc Châu",
  username: "browser-qa",
  role: "ADMINISTRATOR",
  permissions: [],
};
const inventory = [
  {
    id: "warehouse-1",
    code: "NC-001",
    name: "Nhẫn kim cương Aurora",
    supplier: { name: "Kim Hoàn Minh Anh", phone: "0909 123 456" },
    supplierName: "Kim Hoàn Minh Anh",
    supplierPhone: "0909 123 456",
    phone: "0909 123 456",
    thumbnail: image,
    images: [image],
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
        code: "NH-V18K-BM-1P25C-N12",
        size: "12",
        weight: 1.25,
        price: 850_000,
        laborCost: 0,
        platingCost: 0,
        importPrice: 500_000,
        stock: 6,
      },
      {
        id: "warehouse-1-sku-2",
        code: "NH-V18K-BM-1P4C-N14",
        size: "14",
        weight: 1.4,
        price: 1_100_000,
        laborCost: 0,
        platingCost: 0,
        importPrice: 650_000,
        stock: 8,
      },
    ],
    price: 850_000,
    laborCost: 0,
    platingCost: 0,
    importPrice: 500_000,
    weight: 1.25,
    size: "12",
    stock: 14,
    sold: 1,
    pending: 1,
    status: "active",
    createdBy: { id: "browser-user", name: "Ngọc Châu" },
    createdAt: "2026-07-24T03:00:00.000Z",
    updatedAt: "2026-07-26T07:30:00.000Z",
  },
];

function respond(response, status, body) {
  response.writeHead(status, {
    ...cors,
    ...(body === undefined ? {} : { "Content-Type": "application/json" }),
  });
  response.end(body === undefined ? "" : JSON.stringify(body));
}

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  if (request.method === "OPTIONS") return respond(response, 204);
  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    return respond(response, 200, { token: "browser-qa-token", user });
  }
  if (request.method === "GET" && url.pathname === "/api/auth/me") {
    return respond(response, 200, { user });
  }
  if (request.method === "GET" && url.pathname === "/api/patterns") {
    const items = [
      {
        id: "pattern-1",
        name: "Bông mai",
        description: "Hoa năm cánh",
        createdBy: { id: user.id, name: user.name },
      },
    ];
    return respond(response, 200, {
      items,
      page: 1,
      limit: 20,
      total: items.length,
      totalPages: 1,
    });
  }
  if (
    request.method === "GET" &&
    ["/api/categories", "/api/materials"].includes(url.pathname)
  ) {
    const resource = url.pathname.split("/").pop();
    const type = resource === "materials" ? "material" : "category";
    const item =
      type === "category"
        ? {
            id: "category-1",
            name: "Nhẫn",
            type,
            status: "active",
            sortOrder: 0,
            usageCount: 1,
            updatedAt: inventory[0].updatedAt,
          }
        : {
            id: "material-1",
            name: "Vàng 18K",
            type,
            status: "active",
            sortOrder: 0,
            usageCount: 1,
            updatedAt: inventory[0].updatedAt,
          };
    const items = [item];
    return respond(response, 200, {
      items,
      page: 1,
      limit: 20,
      total: items.length,
      totalPages: 1,
    });
  }
  if (request.method === "GET" && url.pathname === "/api/categories/summary") {
    return respond(response, 200, {
      activeCategories: 1,
      activeMaterials: 1,
      totalUsage: 2,
    });
  }
  if (
    request.method === "GET" &&
    url.pathname === "/api/warehoused-goods/options"
  ) {
    return respond(response, 200, {
      categories: [{ id: "category-1", name: "Nhẫn", type: "category" }],
      materials: [{ id: "material-1", name: "Vàng 18K", type: "material" }],
      patterns: [{ id: "pattern-1", name: "Bông mai", type: "pattern" }],
      silverPrice: 220_000,
    });
  }
  if (
    request.method === "GET" &&
    url.pathname === "/api/warehoused-goods"
  ) {
    const query = (url.searchParams.get("query") || "").toLocaleLowerCase(
      "vi-VN",
    );
    const items = inventory.filter((item) =>
      [item.name, item.code, item.supplierName, item.supplierPhone]
        .join(" ")
        .toLocaleLowerCase("vi-VN")
        .includes(query),
    );
    return respond(response, 200, {
      items,
      page: 1,
      limit: 20,
      total: items.length,
      totalPages: items.length ? 1 : 0,
    });
  }
  if (
    request.method === "GET" &&
    url.pathname === "/api/warehoused-goods/warehouse-1"
  ) {
    return respond(response, 200, { item: inventory[0] });
  }
  if (request.method === "GET" && url.pathname === "/api/source-of-goods") {
    const items = [
      {
        id: "source-1",
        name: inventory[0].supplierName,
        phone: inventory[0].supplierPhone,
        itemCount: 1,
        totalImportValue: inventory[0].importPrice,
        price: inventory[0].importPrice,
        latestImportAt: inventory[0].updatedAt,
      },
    ];
    return respond(response, 200, {
      items,
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  }
  return respond(response, 404, {
    message: "Mock route not found",
    code: "NOT_FOUND",
  });
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`CMS_2 browser mock API listening on ${port}\n`);
});
