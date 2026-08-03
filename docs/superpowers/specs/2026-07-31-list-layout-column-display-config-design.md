# ListLayout Column Display Config Design

## Summary

Add an optional per-column display target so a resource can show a field in DataTable, Card Grid, or both without duplicating column definitions.

## Contract

```ts
type ColumnDisplayMode = "both" | "table" | "card";

interface ColumnDefinition {
  displayIn?: ColumnDisplayMode;
}
```

If `displayIn` is omitted, the column displays in both renderers. The config does not provide a value that hides a column from both renderers.

Examples:

```ts
const columns: ColumnDefinition[] = [
  { key: "name", label: "Tên", type: "text" },
  { key: "description", label: "Mô tả", type: "text", displayIn: "table" },
  { key: "thumbnail", label: "Ảnh", type: "image", displayIn: "card" },
];
```

## Rendering Rules

- DataTable renders columns whose `displayIn` is omitted, `"both"`, or `"table"`.
- Card Grid renders columns whose `displayIn` is omitted, `"both"`, or `"card"`.
- The existing `visible: false` behavior remains backward compatible and still excludes a column before renderer-specific display rules.
- Card title, status, and metadata selection operate only on columns eligible for Card Grid.
- Sorting, cell renderers, row actions, pagination, filters, and view persistence remain unchanged.

## Architecture

A shared pure helper owns the visibility rule so DataTable and Card Grid cannot diverge. Both renderers call the helper with their target mode instead of duplicating conditional expressions.
