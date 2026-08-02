# List View Toggle Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the oversized dark Table/Card Grid buttons with the approved compact labeled segmented control while preserving view switching, persistence, and accessibility.

**Architecture:** Keep the existing `useListViewMode` behavior unchanged. Update only `ListShell.vue` presentation markup and scoped styles, then extend the current ListShell unit and responsive E2E coverage so the visual contract is explicit and regression-resistant.

**Tech Stack:** Vue 3, TypeScript, scoped CSS, Vitest, Vue Test Utils, Playwright.

**Project restriction:** Do not run Git commands. Commit steps are intentionally omitted.

---

### Task 1: Lock the approved toggle contract with a failing unit test

**Files:**

- Modify: `tests/unit/components/ListLayout/index.test.ts`
- Test: `tests/unit/components/ListLayout/index.test.ts`

- [ ] **Step 1: Extend the switching test with visible labels and dedicated state classes**

Add assertions before and after the existing grid click:

```ts
const tableToggle = wrapper.get('[data-testid="view-mode-table"]');
const gridToggle = wrapper.get('[data-testid="view-mode-grid"]');

expect(tableToggle.text()).toContain("Bảng");
expect(gridToggle.text()).toContain("Thẻ");
expect(tableToggle.classes()).toContain("is-active");
expect(gridToggle.classes()).not.toContain("is-active");

await gridToggle.trigger("click");

expect(tableToggle.classes()).not.toContain("is-active");
expect(gridToggle.classes()).toContain("is-active");
```

- [ ] **Step 2: Run the focused test and verify the new contract fails**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/index.test.ts
```

Expected: FAIL because the current icon-only Bootstrap buttons do not contain the visible `Bảng`/`Thẻ` labels or `is-active` class.

### Task 2: Implement visual option A in ListShell

**Files:**

- Modify: `src/components/ListLayout/ListShell.vue`
- Test: `tests/unit/components/ListLayout/index.test.ts`

- [ ] **Step 1: Replace Bootstrap button-group presentation with dedicated semantic classes**

Use the following toggle structure while preserving test IDs, titles, click handlers, and `aria-pressed`:

```vue
<div
  class="list-view-toggle"
  role="group"
  aria-label="Chế độ hiển thị danh sách"
  data-testid="view-mode-toggle"
>
  <button
    type="button"
    class="list-view-toggle__option"
    :class="{ 'is-active': viewMode === 'table' }"
    :aria-pressed="viewMode === 'table'"
    data-testid="view-mode-table"
    title="Hiển thị dạng bảng"
    @click="setViewMode('table')"
  >
    <AppIcon name="table" />
    <span>Bảng</span>
  </button>
  <button
    type="button"
    class="list-view-toggle__option"
    :class="{ 'is-active': viewMode === 'grid' }"
    :aria-pressed="viewMode === 'grid'"
    data-testid="view-mode-grid"
    title="Hiển thị dạng thẻ"
    @click="setViewMode('grid')"
  >
    <AppIcon name="grid" />
    <span>Thẻ</span>
  </button>
</div>
```

- [ ] **Step 2: Add scoped styles for the light segmented control**

Add a scoped style block to `ListShell.vue`:

```css
.list-view-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.1875rem;
  border: 1px solid var(--phoenix-border-color-translucent);
  border-radius: 0.625rem;
  background: rgba(var(--phoenix-tertiary-bg-rgb), 0.38);
}

.list-view-toggle__option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4375rem;
  min-height: 2.125rem;
  padding: 0.375rem 0.6875rem;
  border: 0;
  border-radius: 0.4375rem;
  color: var(--phoenix-secondary-color);
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1;
  transition:
    color 150ms ease,
    background-color 150ms ease,
    box-shadow 150ms ease;
}

.list-view-toggle__option:hover:not(.is-active) {
  color: var(--phoenix-body-color);
  background: rgba(var(--phoenix-emphasis-bg-rgb), 0.55);
}

.list-view-toggle__option.is-active {
  color: var(--phoenix-primary);
  background: var(--phoenix-emphasis-bg);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.14);
}

.list-view-toggle__option:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(var(--phoenix-primary-rgb), 0.24);
}

.list-view-toggle__option :deep(.cms-icon) {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
}
```

- [ ] **Step 3: Run the focused unit test and verify it passes**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/index.test.ts
```

Expected: PASS with both responsive default and switching/persistence tests green.

### Task 3: Verify responsive layout and production safety

**Files:**

- Modify: `tests/e2e/responsive-matrix.spec.ts`
- Test: `tests/e2e/responsive-matrix.spec.ts`

- [ ] **Step 1: Assert the visible labels and compact dimensions on the categories route**

Inside the existing `/categories` branch, assert both labels and bound the toggle height:

```ts
const viewToggle = page.getByTestId("view-mode-toggle");
await expect(viewToggle).toContainText("Bảng");
await expect(viewToggle).toContainText("Thẻ");

const toggleBox = await viewToggle.boundingBox();
expect(toggleBox).not.toBeNull();
expect(toggleBox?.height || 0).toBeLessThanOrEqual(44);
```

- [ ] **Step 2: Run focused unit, responsive E2E, typecheck, lint, formatting, and build checks**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/index.test.ts
npx playwright test tests/e2e/responsive-matrix.spec.ts --project=desktop-1440 --project=mobile-390
npm run typecheck
npm run lint
npx prettier --check src/components/ListLayout/ListShell.vue tests/unit/components/ListLayout/index.test.ts tests/e2e/responsive-matrix.spec.ts
npm run build
```

Expected: all focused checks exit with code 0. The pre-existing repository-wide `npm run format:check` failure is outside this focused redesign and must not be auto-fixed.

- [ ] **Step 3: Visually inspect desktop and mobile**

Verify on `/categories` and `/orders` that:

- the toggle is visually secondary to `Thêm mới`;
- the active state is white/blue rather than dark filled;
- labels and icons remain centered without wrapping;
- the control stays compact and introduces no horizontal overflow;
- clicking both options still switches the renderer and persists after reload.
