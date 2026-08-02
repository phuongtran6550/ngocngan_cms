import type { ColumnDefinition, ResourceRow } from "@/config/resource";

export interface TableCellContext {
  row: ResourceRow;
  column: ColumnDefinition;
  rowIndex?: number;
  page?: number;
  limit?: number;
}

export interface TableCellAction {
  type: "copy" | "hyperlink" | "action";
  value: unknown;
}
