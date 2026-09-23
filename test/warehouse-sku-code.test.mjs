import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, deps = {}) {
  const source = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext("(function(require,module,exports){" + code + "\n})", {
    setTimeout, clearTimeout,
  })(name => deps[name] || {}, module, module.exports);
  return module.exports;
}

const skuCodeModule = load("views/WarehousedGoods/sku-code.ts");
const { buildSkuCode, suggestSkuCodes, formatGroupName } = skuCodeModule;

test("formatGroupName normalizes group names to N<digit>", () => {
  assert.equal(formatGroupName("Nhóm 7"), "N7");
  assert.equal(formatGroupName("Nhom 7"), "N7");
  assert.equal(formatGroupName("N7"), "N7");
  assert.equal(formatGroupName("7"), "N7");
  assert.equal(formatGroupName("Nhóm 12"), "N12");
  assert.equal(formatGroupName("Nhóm A"), "NA");
  assert.equal(formatGroupName(""), "");
});

test("buildSkuCode places category group code before hyphen for piece goods (đồ món)", () => {
  const categoryGroups = [
    { name: "Nhóm 7", fromPrice: 100000, toPrice: 200000 },
    { name: "Nhóm 8", fromPrice: 200001, toPrice: 300000 },
  ];

  // Case 1: Xi vàng (V) + Nhóm 7 (N7) => VN7-...
  const code1 = buildSkuCode({
    pricingType: "Đồ món",
    name: "Dây chuyền bi",
    material: "Xi vàng",
    categoryGroups,
    price: 150000,
    weight: 0,
    size: "",
  });
  assert.equal(code1, "VN7-DCB");

  // Case 2: Vàng (V) + Nhóm 8 (N8) + Size 12 => VN8-...12
  const code2 = buildSkuCode({
    pricingType: "Đồ món",
    name: "Nhẫn nữ",
    material: "Vàng",
    categoryGroups,
    price: 250000,
    weight: 0,
    size: "12",
  });
  assert.equal(code2, "VN8-NN12");

  // Case 3: Bạc (B) + Nhóm 7 (N7) => BN7-...
  const code3 = buildSkuCode({
    pricingType: "Đồ món",
    name: "Lắc tay",
    material: "Bạc",
    categoryGroups,
    price: 120000,
    weight: 0,
    size: "",
  });
  assert.equal(code3, "BN7-LT");

  // Case 4: Đồ cân (pricingType: "Đồ cân") giữ nguyên định dạng (không gán nhóm vào trước '-')
  const codeWeighted = buildSkuCode({
    pricingType: "Đồ cân",
    name: "Dây chuyền bi",
    material: "Xi vàng",
    categoryGroups,
    price: 150000,
    weight: 1.5,
    size: "",
  });
  assert.equal(codeWeighted, "V-DCB1C5");
});

test("suggestSkuCodes handles automatic SKU code generation for piece goods", () => {
  const categoryGroups = [
    { name: "Nhóm 7", fromPrice: 100000, toPrice: 200000 },
  ];

  const skus = [
    {
      code: "",
      codeMode: "auto",
      codeSource: "",
      weight: 0,
      size: "",
      price: 150000,
    },
    {
      code: "",
      codeMode: "auto",
      codeSource: "",
      weight: 0,
      size: "",
      price: 150000,
    },
  ];

  const context = {
    pricingType: "Đồ món",
    name: "Dây chuyền",
    material: "Xi vàng",
    categoryGroups,
  };

  const results = suggestSkuCodes(skus, context);
  assert.equal(results[0].code, "VN7-DC");
  assert.equal(results[1].code, "VN7-DC-02");
});

test("buildSkuCode does not keep duplicate group text at the back (e.g. VB8-BVHT8L instead of VB8-BVHT8LB8)", () => {
  const categoryGroups = [
    { name: "B8", fromPrice: 100000, toPrice: 200000 },
  ];

  // Case 1: Tên sản phẩm có đuôi B8 -> VB8-BVHT8L
  const code1 = buildSkuCode({
    pricingType: "Đồ món",
    name: "Bông Vàng Hột Tim 8L B8",
    material: "Xi vàng",
    categoryGroups,
    price: 150000,
    weight: 0,
    size: "",
  });
  assert.equal(code1, "VB8-BVHT8L");

  // Case 2: Tên sản phẩm có đuôi Nhóm 8, group là B8 -> VB8-BVHT8L
  const code2 = buildSkuCode({
    pricingType: "Đồ món",
    name: "Bông Vàng Hột Tim 8L Nhóm 8",
    material: "Xi vàng",
    categoryGroups,
    price: 150000,
    weight: 0,
    size: "",
  });
  assert.equal(code2, "VB8-BVHT8L");

  // Case 3: Tên sản phẩm có size 8L ở trường size thay vì trường name -> VB8-BVHT8L
  const code3 = buildSkuCode({
    pricingType: "Đồ món",
    name: "Bông Vàng Hột Tim B8",
    material: "Xi vàng",
    categoryGroups,
    price: 150000,
    weight: 0,
    size: "8L",
  });
  assert.equal(code3, "VB8-BVHT8L");
});

