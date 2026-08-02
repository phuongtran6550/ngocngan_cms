import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../src/views",
);

const operationalPages = [
  "Account/Profile.vue",
  "Account/ChangePassword.vue",
  "Orders/add.vue",
  "Orders/detail.vue",
  "Orders/missing.vue",
  "WarehousedGoods/add.vue",
  "WarehousedGoods/detail.vue",
  "WarehousedGoods/edit.vue",
  "Zalo/index.vue",
  "Zalo/callback.vue",
];

const operationalForms = [
  "Account/Profile.vue",
  "Account/ChangePassword.vue",
  "Orders/components/OrderForm.vue",
  "WarehousedGoods/components/WarehouseCreateForm.vue",
];

const genericDetailPages = ["Orders/detail.vue"];

const draftStatePages = ["Orders/missing.vue"];

const formSections = [
  "Orders/components/OrderForm.vue",
  "WarehousedGoods/components/WarehouseCreateForm.vue",
  "Orders/components/OrderItemsEditor.vue",
];

const shellPages = [
  "Orders/add.vue",
  "WarehousedGoods/add.vue",
  "WarehousedGoods/edit.vue",
  "Zalo/index.vue",
  "Zalo/callback.vue",
  "Page403.vue",
];

const resourceConfigFiles = [
  "Categories/config.ts",
  "Customers/config.ts",
  "Orders/config.ts",
  "Sources/config.ts",
  "WarehousedGoods/config.ts",
  "Administrator/Roles/config.ts",
  "Administrator/User/config.ts",
];

describe("Phoenix page anatomy", () => {
  it.each(operationalPages)("uses the shared page header for %s", (file) => {
    const source = readFileSync(resolve(sourceRoot, file), "utf8");

    expect(source).toContain('"@/components/app/PageHeader.vue"');
    expect(source).toContain("<PageHeader");
  });

  it.each(operationalForms)(
    "uses native Phoenix cards instead of a parallel detail-card style for %s",
    (file) => {
      const source = readFileSync(resolve(sourceRoot, file), "utf8");

      expect(source).toContain('class="card');
      expect(source).not.toContain("cms-detail-card");
    },
  );

  it.each(["Account/Profile.vue", "Account/ChangePassword.vue"])(
    "uses the Phoenix card header/body anatomy for %s",
    (file) => {
      const source = readFileSync(resolve(sourceRoot, file), "utf8");

      expect(source).toContain(
        'class="card-header bg-transparent border-bottom"',
      );
      expect(source).toContain('class="card-body"');
      expect(source).not.toContain("cms-form-card");
    },
  );

  it.each(genericDetailPages)(
    "uses shared Phoenix detail primitives for %s",
    (file) => {
      const source = readFileSync(resolve(sourceRoot, file), "utf8");

      expect(source).toContain('"@/components/media/ResourceImageCard.vue"');
      expect(source).toContain('"@/components/app/DetailDefinitionList.vue"');
      expect(source).not.toContain("cms-detail-card");
      expect(source).not.toContain("cms-detail-grid");
      expect(source).not.toMatch(/cms-(order|warehouse)-detail-image/);
    },
  );

  it("uses the approved product and SKU detail composition", () => {
    const source = readFileSync(
      resolve(sourceRoot, "WarehousedGoods/detail.vue"),
      "utf8",
    );

    expect(source).toContain('"@/components/media/ResourceImageCard.vue"');
    expect(source).toContain('"@/views/WarehousedGoods/product-summary"');
    expect(source).toContain(
      '"@/views/WarehousedGoods/components/JewelryBarcodeLabel.vue"',
    );
    expect(source).toContain('data-testid="desktop-sku-row"');
    expect(source).toContain('data-testid="mobile-sku-card"');
    expect(source).not.toContain("<section");
    expect(source).not.toContain("cms-detail-card");
    expect(source).not.toContain("cms-detail-grid");
  });

  it.each(draftStatePages)(
    "uses shared Phoenix card primitives for %s",
    (file) => {
      const source = readFileSync(resolve(sourceRoot, file), "utf8");

      expect(source).toContain('"@/components/media/ResourceImageCard.vue"');
      expect(source).toContain('"@/components/app/DetailDefinitionList.vue"');
      expect(source).not.toMatch(/cms-order-draft/);
    },
  );

  it.each(formSections)(
    "does not introduce a parallel form visual system in %s",
    (file) => {
      const source = readFileSync(resolve(sourceRoot, file), "utf8");

      expect(source).not.toMatch(/cms-(order|warehouse)-/);
    },
  );

  it.each(shellPages)(
    "lets the Phoenix content shell own horizontal spacing for %s",
    (file) => {
      const source = readFileSync(resolve(sourceRoot, file), "utf8");

      expect(source).not.toContain('class="container-fluid px-0"');
    },
  );

  it("uses Phoenix's native table viewport instead of an unused card-replacement contract", () => {
    for (const file of resourceConfigFiles) {
      const source = readFileSync(resolve(sourceRoot, file), "utf8");
      expect(source).not.toContain("responsive:");
      expect(source).not.toContain("mobile: true");
    }

    expect(
      existsSync(
        resolve(sourceRoot, "components/Table/ResponsiveCardList.vue"),
      ),
    ).toBe(false);
  });
});
