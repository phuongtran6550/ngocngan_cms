import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function compileModule(path, deps = {}) {
  const code = readFileSync(path, "utf-8");
  const transpiled = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const moduleObj = { exports: {} };
  const requireMock = (id) => {
    if (deps[id]) return deps[id];
    throw new Error(`Unmocked dependency: ${id}`);
  };

  const context = vm.createContext({
    module: moduleObj,
    exports: moduleObj.exports,
    require: requireMock,
    console,
    URL,
    Array,
    Object,
    String,
    Number,
    Boolean,
  });

  const script = new vm.Script(transpiled);
  script.runInContext(context);
  return moduleObj.exports;
}

test("formatSuggestionSubtitle formats category, material, pattern, size and weight", () => {
  const deps = {
    "@/request": { request: {}, assetUrl: (p) => p },
    "@/utils/resource-display": { formatMoney: (n) => `${n} đ` },
  };

  const service = compileModule("src/components/Form/search-suggestion.ts", deps);
  const subtitle = service.formatSuggestionSubtitle({
    category: "Nhẫn",
    material: "Vàng 18K",
    pattern: "Trơn",
    size: "12",
    weight: 1.5,
  });

  assert.equal(subtitle, "Nhẫn · Vàng 18K · Trơn · Ni 12 · 1.5 chỉ");
});

test("formatSuggestionSubtitle handles already prefixed Ni and missing fields", () => {
  const deps = {
    "@/request": { request: {}, assetUrl: (p) => p },
    "@/utils/resource-display": { formatMoney: (n) => `${n} đ` },
  };

  const service = compileModule("src/components/Form/search-suggestion.ts", deps);
  const subtitle = service.formatSuggestionSubtitle({
    category: "Lắc tay",
    size: "Ni 15",
  });

  assert.equal(subtitle, "Lắc tay · Ni 15");
});

test("fetchProductSuggestions returns formatted items from API response", async () => {
  let capturedUrl = "";
  let capturedParams = null;

  const mockRequest = {
    get: async (url, config) => {
      capturedUrl = url;
      capturedParams = config.params;
      return {
        data: {
          data: [
            {
              id: "sku-1",
              name: "Nhẫn kim tiền",
              skuCode: "NKT01",
              barcode: "893000001",
              category: "Nhẫn",
              material: "Vàng 9999",
              size: "14",
              weight: 2.1,
              price: 5000000,
              stock: 5,
              thumbnail: "uploads/ring.jpg",
            },
          ],
        },
      };
    },
  };

  const deps = {
    "@/request": { request: mockRequest, assetUrl: (p) => `https://cdn.example.com/${p}` },
    "@/utils/resource-display": { formatMoney: (n) => `${n} đ` },
  };

  const service = compileModule("src/components/Form/search-suggestion.ts", deps);
  const results = await service.fetchProductSuggestions("kim tiền", undefined, 5);

  assert.equal(capturedUrl, "/products");
  assert.equal(capturedParams.query, "kim tiền");
  assert.equal(capturedParams.limit, 5);
  assert.equal(capturedParams.page, 1);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "sku-1");
  assert.equal(results[0].title, "Nhẫn kim tiền");
  assert.equal(results[0].code, "NKT01");
  assert.equal(results[0].badge, "NKT01");
  assert.equal(results[0].url, "/products/sku-1");
  assert.equal(results[0].price, 5000000);
  assert.equal(results[0].stock, 5);
  assert.equal(results[0].thumbnail, "https://cdn.example.com/uploads/ring.jpg");
  assert.equal(results[0].subtitle, "Nhẫn · Vàng 9999 · Ni 14 · 2.1 chỉ");
});

test("fetchWarehouseSuggestions transforms warehouse goods and calculates total stock", async () => {
  let capturedUrl = "";
  let capturedParams = null;

  const mockRequest = {
    get: async (url, config) => {
      capturedUrl = url;
      capturedParams = config.params;
      return {
        data: {
          data: [
            {
              id: "wh-100",
              name: "Dây chuyền Ý 750",
              code: "DCY750",
              category: "Dây chuyền",
              material: "Vàng Ý 750",
              pricingType: "Đồ cân",
              thumbnail: "uploads/chain.jpg",
              skus: [
                { id: "s1", code: "DCY750-1", barcode: "893111", price: 12000000, stock: 3 },
                { id: "s2", code: "DCY750-2", barcode: "893222", price: 15000000, stock: 4 },
              ],
            },
          ],
        },
      };
    },
  };

  const deps = {
    "@/request": { request: mockRequest, assetUrl: (p) => `https://cdn.example.com/${p}` },
    "@/utils/resource-display": { formatMoney: (n) => `${n} đ` },
  };

  const service = compileModule("src/components/Form/search-suggestion.ts", deps);
  const results = await service.fetchWarehouseSuggestions("dây chuyền", undefined, 6);

  assert.equal(capturedUrl, "/warehoused-goods");
  assert.equal(capturedParams.query, "dây chuyền");
  assert.equal(capturedParams.limit, 6);
  assert.equal(capturedParams.page, 1);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "wh-100");
  assert.equal(results[0].title, "Dây chuyền Ý 750");
  assert.equal(results[0].code, "DCY750");
  assert.equal(results[0].url, "/warehoused-goods/wh-100");
  assert.equal(results[0].price, 12000000); // primary SKU price
  assert.equal(results[0].stock, 7); // 3 + 4
  assert.equal(results[0].pricingType, "Đồ cân");
  assert.equal(results[0].subtitle, "Dây chuyền · Vàng Ý 750");
});

test("fetchSearchSuggestions returns empty array when query is empty or whitespace", async () => {
  const deps = {
    "@/request": { request: {}, assetUrl: (p) => p },
    "@/utils/resource-display": { formatMoney: (n) => `${n} đ` },
  };

  const service = compileModule("src/components/Form/search-suggestion.ts", deps);
  const resEmpty = await service.fetchSearchSuggestions("products", "   ");
  assert.equal(Array.isArray(resEmpty), true);
  assert.equal(resEmpty.length, 0);
});
