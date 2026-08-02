# ListLayout Card Grid Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with the test-first workflow. The repository explicitly forbids all Git commands, so this plan contains no commit steps.

**Goal:** Add a reusable `Card Grid` view to the shared `ListLayout`, with responsive defaults and per-resource browser persistence while preserving the existing `DataTable` behavior.

**Architecture:** Keep data loading and list state in the existing `ListLayout` controller. Add a focused `useListViewMode` composable for default resolution and localStorage persistence, a `ResourceCardGrid` renderer that reuses `CellRenderer` and `RowActionMenu`, and let `ListShell` switch renderers without changing rows or pagination.

**Tech Stack:** Vue 3, TypeScript, Vitest + Vue Test Utils, Playwright, Bootstrap/Phoenix CSS, Vite.

---

## File Map

- Create `src/components/ListLayout/useListViewMode.ts`: view-mode type, responsive default, per-resource storage read/write, and safe browser fallbacks.
- Create `src/components/Table/ResourceCardGrid.vue`: hierarchical card renderer with shared cell formatting and row actions.
- Create `tests/unit/components/ListLayout/useListViewMode.test.ts`: red/green tests for defaults, persistence, malformed values, and storage failures.
- Create `tests/unit/components/Table/ResourceCardGrid.test.ts`: card hierarchy, formatting, permissions, and emitted action tests.
- Modify `src/components/ListLayout/ListShell.vue`: compose the toggle, view-mode composable, and card renderer.
- Modify `src/components/ui/AppIcon.vue`: add a table-view icon while retaining the existing grid icon.
- Modify `tests/unit/components/ListLayout/index.test.ts`: align the stale test with the current shared `ListShell` contract and cover view switching.
- Modify `tests/e2e/fixtures.ts`: add a shared helper that explicitly selects table mode for data-table-oriented E2E scenarios.
- Modify table-oriented E2E specs: use the shared helper instead of assuming the responsive default is always a table.
- Modify `tests/e2e/responsive-matrix.spec.ts`: clear the per-resource preference and assert table on desktop and card grid on mobile.

## Task 1: Add the view-mode composable

**Files:**

- Create: `tests/unit/components/ListLayout/useListViewMode.test.ts`
- Create: `src/components/ListLayout/useListViewMode.ts`

- [ ] **Step 1: Write failing tests for desktop and mobile defaults**

Create a `matchMedia` helper in the test file that defines `window.matchMedia` with a configurable `matches` value. Clear local storage before every test, then assert:

```ts
it("defaults to table on desktop when no resource preference exists", () => {
  setViewportMatch(false);
  const { viewMode } = useListViewMode(ref("categories"));
  expect(viewMode.value).toBe("table");
});

it("defaults to grid on mobile when no resource preference exists", () => {
  setViewportMatch(true);
  const { viewMode } = useListViewMode(ref("categories"));
  expect(viewMode.value).toBe("grid");
});
```

- [ ] **Step 2: Run the focused test and verify it fails for the missing module**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/useListViewMode.test.ts
```

Expected: Vitest fails because `src/components/ListLayout/useListViewMode.ts` does not exist.

- [ ] **Step 3: Add persistence and failure-path tests before implementation**

Add tests for the exact per-resource contract:

```ts
it("restores and stores a preference per resource key", () => {
  setViewportMatch(false);
  const first = useListViewMode(ref("categories"));
  first.setViewMode("grid");
  expect(window.localStorage.getItem("ngoc-chau:list-view:categories")).toBe(
    "grid",
  );

  const second = useListViewMode(ref("categories"));
  expect(second.viewMode.value).toBe("grid");
  expect(useListViewMode(ref("orders")).viewMode.value).toBe("table");
});

it("ignores malformed values and storage exceptions", () => {
  window.localStorage.setItem("ngoc-chau:list-view:categories", "cards");
  setViewportMatch(true);
  expect(useListViewMode(ref("categories")).viewMode.value).toBe("grid");

  vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(() =>
    useListViewMode(ref("orders")).setViewMode("grid"),
  ).not.toThrow();
});
```

- [ ] **Step 4: Run the tests and confirm the new assertions fail for the missing implementation**

Run the same focused command and confirm failures identify the missing composable behavior, not a test setup error.

- [ ] **Step 5: Implement the minimal composable**

Implement `ListViewMode = "table" | "grid"` and `useListViewMode(resourceKey: Ref<string> | ComputedRef<string>)`. Use a namespaced key, guard `window`, `localStorage`, and `matchMedia` access with `try/catch`, accept only `table` and `grid`, and initialize from storage before the responsive fallback. Expose:

```ts
export interface ListViewModeController {
  viewMode: Ref<ListViewMode>;
  setViewMode(mode: ListViewMode): void;
}
```

Use `watch(resourceKey, loadPreference, { immediate: true })` so the same shell remains correct if a definition key changes.

- [ ] **Step 6: Run the composable tests and verify green**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/useListViewMode.test.ts
```

Expected: all composable tests pass.

## Task 2: Build the reusable hierarchical card renderer

**Files:**

- Create: `tests/unit/components/Table/ResourceCardGrid.test.ts`
- Create: `src/components/Table/ResourceCardGrid.vue`

- [ ] **Step 1: Write failing rendering and action tests**

Cover one visible title column, status in the header, metadata labels, formatted values, and row action permissions:

```ts
it("renders a hierarchical card from visible columns", () => {
  const wrapper = mount(ResourceCardGrid, {
    props: {
      columns: [
        { key: "name", label: "Tên", type: "text" },
        { key: "status", label: "Trạng thái", type: "status" },
        { key: "price", label: "Giá", type: "money" },
      ],
      rows: [{ id: "1", name: "Nhẫn cưới", status: "active", price: 1250000 }],
      allowUpdate: true,
      allowDelete: true,
    },
  });

  expect(wrapper.get('[data-testid="resource-card-grid"]').exists()).toBe(true);
  expect(wrapper.get('[data-testid="resource-card"]').text()).toContain(
    "Nhẫn cưới",
  );
  expect(wrapper.get('[data-testid="resource-card"]').text()).toContain(
    "Trạng thái",
  );
  expect(wrapper.get('[data-testid="resource-card"]').text()).toContain(
    "1.250.000 ₫",
  );
});

it("emits cell and row actions with the existing payloads", async () => {
  const row = { id: "custom", name: "Bán hàng", note: "A" };
  const wrapper = mount(ResourceCardGrid, {
    props: {
      columns: [
        { key: "name", label: "Tên", type: "text" },
        {
          key: "note",
          label: "Ghi chú",
          type: "action",
          actions: [{ key: "open", label: "Mở" }],
        },
      ],
      rows: [row],
      allowView: true,
    },
  });
  await wrapper.get('[data-testid="row-action-toggle"]').trigger("click");
  await wrapper.get('[data-testid="row-action-view"]').trigger("click");
  expect(wrapper.emitted("view")?.[0]?.[0]).toEqual(row);
});
```

Add a permission test using `canUpdateRow` and `canDeleteRow` to ensure restricted rows do not expose forbidden actions.

- [ ] **Step 2: Run the focused renderer tests and verify red**

Run:

```bash
npm run test:unit -- tests/unit/components/Table/ResourceCardGrid.test.ts
```

Expected: Vitest fails because the component does not exist.

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

- [ ] **Step 4: Run renderer tests and verify green**

Run the focused renderer command again. Expected: all card rendering and action tests pass.

## Task 3: Integrate the toggle and both renderers into `ListShell`

**Files:**

- Modify: `tests/unit/components/ListLayout/index.test.ts`
- Modify: `src/components/ListLayout/ListShell.vue`
- Modify: `src/components/ui/AppIcon.vue`

- [ ] **Step 1: Replace the stale shell test with failing view-mode behavior tests**

Update the test to mount `ListShell` with its current `definition`, `rows`, and `pagination` props. Add tests that set `matchMedia` to desktop/mobile and clear the categories preference before mounting:

```ts
it("shows DataTable by default on desktop and Card Grid by default on mobile", () => {
  setViewportMatch(false);
  const desktop = mount(ListShell, { props: shellProps() });
  expect(desktop.get('[data-testid="desktop-data-table"]').exists()).toBe(true);
  expect(desktop.find('[data-testid="resource-card-grid"]').exists()).toBe(
    false,
  );

  setViewportMatch(true);
  const mobile = mount(ListShell, { props: shellProps("mobile-categories") });
  expect(mobile.get('[data-testid="resource-card-grid"]').exists()).toBe(true);
  expect(mobile.find('[data-testid="desktop-data-table"]').exists()).toBe(
    false,
  );
});

it("switches without emitting a page event and persists per resource", async () => {
  const wrapper = mount(ListShell, { props: shellProps("switch-categories") });
  await wrapper.get('[data-testid="view-mode-grid"]').trigger("click");
  expect(wrapper.get('[data-testid="resource-card-grid"]').exists()).toBe(true);
  expect(wrapper.emitted("page")).toBeUndefined();
  expect(
    window.localStorage.getItem("ngoc-chau:list-view:switch-categories"),
  ).toBe("grid");
});
```

- [ ] **Step 2: Run the shell tests and verify the new assertions fail**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/index.test.ts
```

Expected: the new selectors fail because the toggle and card renderer are not integrated. This run also documents the pre-existing stale `ListLayout` test contract before it is replaced.

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

- [ ] **Step 6: Run focused shell and table tests**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/index.test.ts tests/unit/components/Table/DataTable.test.ts tests/unit/components/Table/ResourceViews.test.ts tests/unit/components/Table/ResourceCardGrid.test.ts tests/unit/components/ListLayout/useListViewMode.test.ts
```

Expected: all targeted view-mode tests pass and existing table tests remain green.

## Task 4: Make existing E2E coverage deterministic and add responsive assertions

**Files:**

- Modify: `tests/e2e/fixtures.ts`
- Modify: `tests/e2e/{categories,core-pages,orders,patterns,roles,sources,users,warehouse}.spec.ts`
- Modify: `tests/e2e/responsive-matrix.spec.ts`

- [ ] **Step 1: Add a shared explicit table-view helper**

Export a helper from `fixtures.ts` that selects the table only when the responsive default is currently the grid:

```ts
export async function ensureTableView(page: Page): Promise<Locator> {
  const table = page.getByTestId("desktop-data-table");
  if (!(await table.isVisible())) {
    await page.getByTestId("view-mode-table").click();
    await expect(table).toBeVisible();
  }
  return table;
}
```

This keeps table-specific functional tests valid on mobile without masking the real responsive default globally.

- [ ] **Step 2: Update table-oriented specs to request table mode explicitly**

Import and await `ensureTableView(page)` in the existing specs that read `desktop-data-table`. Keep row-action tests view-agnostic because the same `RowActionMenu` is available in both renderers.

- [ ] **Step 3: Add a failing responsive default/persistence test**

In `responsive-matrix.spec.ts`, clear `ngoc-chau:list-view:categories` before navigating, then assert according to the project viewport:

```ts
const isMobile = (page.viewportSize()?.width || 0) < 768;
if (isMobile) {
  await expect(page.getByTestId("resource-card-grid")).toBeVisible();
  await expect(page.getByTestId("desktop-data-table")).toBeHidden();
} else {
  await expect(page.getByTestId("desktop-data-table")).toBeVisible();
  await expect(page.getByTestId("resource-card-grid")).toBeHidden();
}
```

Add a focused persistence check in the mobile branch: click the table toggle, reload, and assert the table remains visible. Clear the preference at the end of the test so the fixture does not leak state.

- [ ] **Step 4: Run the responsive E2E test on desktop and mobile projects**

Run:

```bash
npx playwright test tests/e2e/responsive-matrix.spec.ts --project=desktop-1440 --project=mobile-390
```

Expected: both projects pass, with desktop table and mobile card defaults plus the mobile persistence check.

## Task 5: Type, lint, and build verification

**Files:**

- No additional files unless a command identifies a feature-specific type or lint defect.

- [ ] **Step 1: Run the focused unit suite again**

```bash
npm run test:unit -- tests/unit/components/ListLayout tests/unit/components/Table
```

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
