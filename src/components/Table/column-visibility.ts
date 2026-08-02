import type { ColumnDefinition, ColumnDisplayMode } from "@/config/resource";

export type ColumnRenderer = Exclude<ColumnDisplayMode, "both">;

export function isColumnVisibleIn(
  column: ColumnDefinition,
  renderer: ColumnRenderer,
): boolean {
  if (column.visible === false) return false;
  return (
    !column.displayIn ||
    column.displayIn === "both" ||
    column.displayIn === renderer
  );
}
