import { describe, expect, it } from "vitest";
import { isColumnVisibleIn } from "@/components/Table/column-visibility";
import type { ColumnDefinition } from "@/config/resource";

function column(overrides: Partial<ColumnDefinition> = {}): ColumnDefinition {
  return {
    key: "name",
    label: "Tên",
    type: "text",
    ...overrides,
  };
}

describe("isColumnVisibleIn", () => {
  it("shows omitted and both columns in both renderers", () => {
    expect(isColumnVisibleIn(column(), "table")).toBe(true);
    expect(isColumnVisibleIn(column(), "card")).toBe(true);
    expect(isColumnVisibleIn(column({ displayIn: "both" }), "table")).toBe(
      true,
    );
    expect(isColumnVisibleIn(column({ displayIn: "both" }), "card")).toBe(true);
  });

  it("shows renderer-specific columns only in their configured renderer", () => {
    expect(isColumnVisibleIn(column({ displayIn: "table" }), "table")).toBe(
      true,
    );
    expect(isColumnVisibleIn(column({ displayIn: "table" }), "card")).toBe(
      false,
    );
    expect(isColumnVisibleIn(column({ displayIn: "card" }), "table")).toBe(
      false,
    );
    expect(isColumnVisibleIn(column({ displayIn: "card" }), "card")).toBe(true);
  });

  it("preserves the existing global visible flag", () => {
    expect(
      isColumnVisibleIn(
        column({ displayIn: "table", visible: false }),
        "table",
      ),
    ).toBe(false);
    expect(
      isColumnVisibleIn(column({ displayIn: "card", visible: false }), "card"),
    ).toBe(false);
  });
});
