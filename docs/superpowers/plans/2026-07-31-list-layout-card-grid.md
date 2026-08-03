# ListLayout Card Grid Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with the test-first workflow. The repository explicitly forbids all Git commands, so this plan contains no commit steps.

**Goal:** Add a reusable `Card Grid` view to the shared `ListLayout`, with responsive defaults and per-resource browser persistence while preserving the existing `DataTable` behavior.

**Architecture:** Keep data loading and list state in the existing `ListLayout` controller. Add a focused `useListViewMode` composable for default resolution and localStorage persistence, a `ResourceCardGrid` renderer that reuses `CellRenderer` and `RowActionMenu`, and let `ListShell` switch renderers without changing rows or pagination.

---

## File Map

- Create `src/components/ListLayout/useListViewMode.ts`: view-mode type, responsive default, per-resource storage read/write, and safe browser fallbacks.
- Create `src/components/Table/ResourceCardGrid.vue`: hierarchical card renderer with shared cell formatting and row actions.
- Modify `src/components/ListLayout/ListShell.vue`: compose the toggle, view-mode composable, and card renderer.
- Modify `src/components/ui/AppIcon.vue`: add a table-view icon while retaining the existing grid icon.

## Task 1: Add the view-mode composable

**Files:**

- Create: `src/components/ListLayout/useListViewMode.ts`

- [ ] **Step 5: Implement the minimal composable**

Implement `ListViewMode = "table" | "grid"` and `useListViewMode(resourceKey: Ref<string> | ComputedRef<string>)`. Use a namespaced key, guard `window`, `localStorage`, and `matchMedia` access with `try/catch`, accept only `table` and `grid`, and initialize from storage before the responsive fallback. Expose:

```ts
export interface ListViewModeController {
  viewMode: Ref<ListViewMode>;
  setViewMode(mode: ListViewMode): void;
}
```

Use `watch(resourceKey, loadPreference, { immediate: true })` so the same shell remains correct if a definition key changes.

## Task 2: Build the reusable hierarchical card renderer

**Files:**

- Create: `src/components/Table/ResourceCardGrid.vue`

- [ ] **Step 3: Implement the card renderer with shared renderers**

Implement `ResourceCardGrid.vue` with these contracts:

- Props: `columns`, `rows`, `page`, `limit`, `allowView`, `allowUpdate`, `allowDelete`, `canUpdateRow`, `canDeleteRow`.
- Emits: `sort` is intentionally omitted from the card header; `view`, `edit`, `delete`, and `cell-action` match `DataTable`.
- `visibleColumns` filters `column.visible !== false`.
- `statusColumn` selects the first visible `status` or `badge` column.
- `titleColumn` prefers the first visible readable text-like column (`text`, `profile`, `group_text`, `hyperlink`, or `textIsRead`) that is not `stt`, `action`, or the status column, then falls back to the first remaining non-utility column.
- `metadataColumns` contains remaining visible columns except `stt`; inline `action` cells remain metadata so resource-specific commands are preserved alongside the standard row menu.
- `CellRenderer` renders title, status, and metadata; cell actions emit `{ row, column, action }`.
- `RowActionMenu` receives the shared row identity and row permission callbacks.
- Root test contracts are `data-testid="resource-card-grid"` and `data-testid="resource-card"`.
- Use Bootstrap classes for `row-cols-1 row-cols-md-2 row-cols-xl-3` and a small scoped style block for wrapping, metadata spacing, and card header alignment.

Do not duplicate cell formatting, resource identity, or action-menu behavior.

## Task 3: Integrate the toggle and both renderers into `ListShell`

**Files:**

- Modify: `src/components/ListLayout/ListShell.vue`
- Modify: `src/components/ui/AppIcon.vue`

- [ ] **Step 3: Add the table icon and compose the view-mode controller**

Add a simple table icon entry to `AppIcon.vue`. In `ListShell.vue`, import `computed`, `useListViewMode`, and `ResourceCardGrid`; create a computed resource key and expose `viewMode` and `setViewMode` from `setup`. Keep the current Options API methods and props intact.

- [ ] **Step 4: Add accessible toggle controls to the existing toolbar**

Place a `role="group"` control with an accessible label beside the filters/actions. Add two buttons:

```html
<button
  data-testid="view-mode-table"
  :aria-pressed="viewMode === 'table'"
  @click="setViewMode('table')"
>
  <AppIcon name="table" />
  <span class="visually-hidden">Hiển thị dạng bảng</span>
</button>
<button
  data-testid="view-mode-grid"
  :aria-pressed="viewMode === 'grid'"
  @click="setViewMode('grid')"
>
  <AppIcon name="grid" />
  <span class="visually-hidden">Hiển thị dạng thẻ</span>
</button>
```

Use the existing Phoenix `btn`, `btn-sm`, and active-state classes; do not create a second toolbar system.

- [ ] **Step 5: Switch renderers without changing list state**

Keep loading, empty, error, and pagination outside the renderer branch. Within the non-empty branch, render `DataTable` for `viewMode === "table"` and `ResourceCardGrid` otherwise. Pass identical columns, rows, page, limit, action permissions, row permission callbacks, and event forwarding to both.

## Task 5: Type, lint, and build verification

**Files:**

- No additional files unless a command identifies a feature-specific type or lint defect.

- [ ] **Step 1: Run the focused unit suite again**

Expected: all feature-area tests pass. Record unrelated pre-existing failures separately instead of changing unrelated components.

- [ ] **Step 2: Run type checking**

```bash
npm run typecheck
```

Expected: exit code `0` with no TypeScript diagnostics attributable to the feature.

- [ ] **Step 3: Run lint and formatting checks**

```bash
npm run lint
npm run format:check
```

Expected: both commands exit `0`. Fix only feature files if they report issues.

- [ ] **Step 4: Run the production build**

```bash
npm run build
```

Expected: `vue-tsc` and Vite complete successfully.

- [ ] **Step 5: Inspect the final feature files and verify the acceptance checklist**

Confirm the implementation provides:

- table default at `768px` and above with no saved preference;
- grid default below `768px` with no saved preference;
- per-resource persistence after manual switch;
- equivalent cell formatting and row actions;
- no data reload or pagination reset on view switch;
- no horizontal overflow at the responsive test widths;
- no duplicate cell/action logic.

Report any unrelated baseline failures with their command and test names rather than claiming the entire repository is green.
