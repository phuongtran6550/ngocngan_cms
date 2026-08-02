import { readFileSync } from "node:fs";
import { materialDefinition, materialResource } from "@/views/Materials/config";

describe("material definition", () => {
  it("owns the Materials endpoint, independent permissions, and only material fields", () => {
    expect(materialDefinition.endpoint).toBe("/materials");
    expect(materialDefinition.permission).toEqual({
      view: "materials.view",
      create: "materials.create",
      update: "materials.update",
      delete: "materials.delete",
    });
    expect(materialDefinition.columns.map((column) => column.key)).toEqual([
      "name",
      "productCount",
      "createdBy",
    ]);
    expect(materialDefinition.columns.find((column) => column.key === "productCount")).toEqual({
      key: "productCount",
      label: "Số sản phẩm",
      type: "number",
    });
    expect(materialDefinition.columns.find((column) => column.key === "createdBy")).toEqual({
      key: "createdBy",
      label: "Người tạo",
      type: "profile",
      display: {
        avatar: "createdBy.avatar",
        title: "createdBy.name",
        desc: "createdBy.description",
      },
    });
    expect(materialDefinition.form?.fields.map((field) => ({
      key: field.key,
      required: Boolean(field.required),
      type: field.type,
      maxLength: field.maxLength,
    }))).toEqual([
      { key: "name", required: true, type: "text", maxLength: 120 },
      { key: "description", required: false, type: "textarea", maxLength: 500 },
    ]);
    expect(materialDefinition.filters).toBeUndefined();
    expect(materialDefinition.actions).toEqual({
      create: true,
      update: true,
      delete: true,
      refresh: true,
    });
    expect(materialResource.selectedColumns).toEqual([
      "name",
      "productCount",
      "createdBy",
    ]);
  });

  it("keeps Materials types and page imports outside the Categories module", () => {
    const materialDirectory = `${process.cwd()}/src/views/Materials/`;
    const source = ["types.ts", "config.ts", "index.vue"]
      .map((filename) => readFileSync(`${materialDirectory}${filename}`, "utf8"))
      .join("\n");

    expect(source).not.toMatch(/@\/views\/Categories\//);
    expect(source).not.toMatch(/Category(?:Type|Status|FormModel|ListParams|ListResponse|ItemResponse)?/);
  });
});
