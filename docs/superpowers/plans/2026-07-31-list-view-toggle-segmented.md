# List View Toggle Segmented Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax and must be executed in order. No Git commands or commit steps are included because the project instructions prohibit Git operations.

**Goal:** Replace the two standalone icon buttons in `ListShell` with the approved compact labeled segmented control for `Bảng` and `Thẻ`, without changing view behavior.

**Architecture:** Keep `useListViewMode`, persistence, responsive defaults, renderer selection, and existing test IDs unchanged. Add a display label to the existing `viewOptions` configuration, render the options through the same `v-for`, and centralize all new visual behavior in the scoped `ListShell.vue` styles.

**Tech Stack:** Vue 3, TypeScript, scoped CSS, Vitest, Vue Test Utils, Playwright, Vite.

---

### Task 1: Lock the segmented-control contract with a failing unit test

**Files:**

- Modify: `tests/unit/components/ListLayout/index.test.ts`
- Test: `tests/unit/components/ListLayout/index.test.ts`

- [ ] **Step 1: Replace icon-only assertions with the approved labeled-control assertions**

In `it("switches views without changing pagination and persists per resource", ...)`, keep the existing test IDs and persistence assertions, then change the pre-click expectations to assert visible labels and the shared option class:

```ts
expect(tableToggle.text()).toContain("Bảng");
expect(gridToggle.text()).toContain("Thẻ");
expect(tableToggle.classes()).toEqual(
  expect.arrayContaining(["list-view-toggle__option", "is-active"]),
);
expect(gridToggle.classes()).toEqual(
  expect.arrayContaining(["list-view-toggle__option"]),
);
expect(gridToggle.classes()).not.toContain("is-active");
expect(tableToggle.attributes("aria-pressed")).toBe("true");
expect(gridToggle.attributes("aria-pressed")).toBe("false");
```

After `await gridToggle.trigger("click")`, assert the labels remain present, the active class swaps, and the existing localStorage assertion still passes:

```ts
expect(tableToggle.text()).toContain("Bảng");
expect(gridToggle.text()).toContain("Thẻ");
expect(tableToggle.classes()).not.toContain("is-active");
expect(gridToggle.classes()).toEqual(
  expect.arrayContaining(["list-view-toggle__option", "is-active"]),
);
expect(tableToggle.attributes("aria-pressed")).toBe("false");
expect(gridToggle.attributes("aria-pressed")).toBe("true");
```

Remove assertions that require Bootstrap `btn`, `btn-phoenix-primary`, `px-3`, `me-1`, `border-0`, or `text-body` classes because the segmented control owns those visual states through its scoped classes.

- [ ] **Step 2: Run the focused test and verify it fails for the missing visible labels**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/index.test.ts
```

Expected result before production changes: the test fails at `expect(tableToggle.text()).toContain("Bảng")` because the current options render only icons.

---

### Task 2: Implement the approved segmented control in `ListShell`

**Files:**

- Modify: `src/components/ListLayout/ListShell.vue:80-110,200-225,284-310`
- Test: `tests/unit/components/ListLayout/index.test.ts`

- [ ] **Step 1: Add a reusable visible label to the existing view-option configuration**

Extend `ListViewOption` and each entry in `viewOptions` without duplicating mode logic:

```ts
interface ListViewOption {
  accessibilityLabel: string;
  icon: string;
  label: string;
  mode: ListViewMode;
}

const viewOptions: readonly ListViewOption[] = [
  {
    accessibilityLabel: "Hiển thị dạng bảng",
    icon: "table",
    label: "Bảng",
    mode: "table",
  },
  {
    accessibilityLabel: "Hiển thị dạng thẻ",
    icon: "grid",
    label: "Thẻ",
    mode: "grid",
  },
];
```

- [ ] **Step 2: Render labels inside the existing button loop and preserve behavior contracts**

Replace the Bootstrap utility classes and per-button margin with the shared segmented classes, while retaining the existing `v-for`, `setViewMode`, labels, test IDs, title, and `aria-pressed`:

```vue
<div
  class="list-view-toggle"
  role="group"
  aria-label="Chế độ hiển thị danh sách"
  data-testid="view-mode-toggle"
>
  <button
    v-for="option in viewOptions"
    :key="option.mode"
    type="button"
    class="list-view-toggle__option"
    :class="{ 'is-active': viewMode === option.mode }"
    :aria-label="option.accessibilityLabel"
    :aria-pressed="viewMode === option.mode"
    :data-testid="`view-mode-${option.mode}`"
    :title="option.accessibilityLabel"
    @click="setViewMode(option.mode)"
  >
    <AppIcon :name="option.icon" />
    <span>{{ option.label }}</span>
  </button>
</div>
```

- [ ] **Step 3: Add the scoped visual system for the compact light segmented control**

Replace the current toggle styles with this single shared style system. It keeps the control intrinsic-width, prevents label wrapping, gives the active option a white lift, and provides a keyboard focus ring:

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
  white-space: nowrap;
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

- [ ] **Step 4: Run the focused unit test and verify the implementation passes**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/index.test.ts
```

Expected result: both ListShell tests pass, including desktop/mobile defaults, visible labels, active-state swapping, pagination stability, and per-resource persistence.

---

### Task 3: Add responsive visual regression coverage

**Files:**

- Modify: `tests/e2e/responsive-matrix.spec.ts:16-46`
- Test: `tests/e2e/responsive-matrix.spec.ts`

- [ ] **Step 1: Assert labels and compact dimensions on the categories route**

Inside the existing `/categories` branch, keep the stable test-ID locators and add:

```ts
await expect(viewToggle).toContainText("Bảng");
await expect(viewToggle).toContainText("Thẻ");

const toggleBox = await viewToggle.boundingBox();
expect(toggleBox).not.toBeNull();
expect(toggleBox?.height || 0).toBeLessThanOrEqual(44);
```

Keep the current assertions for responsive renderer defaults, transparent Card Grid surface, table surface restoration after switching, persistence after reload, and document/body width.

- [ ] **Step 2: Run the focused responsive matrix**

Run:

```bash
npx playwright test tests/e2e/responsive-matrix.spec.ts --project=desktop-1440 --project=mobile-390
```

Expected result: all desktop and mobile route checks pass, including label visibility, compact control height, both renderers, persistence, and no horizontal overflow.

---

### Task 4: Run final static and production verification

**Files:**

- Verify: `src/components/ListLayout/ListShell.vue`
- Verify: `tests/unit/components/ListLayout/index.test.ts`
- Verify: `tests/e2e/responsive-matrix.spec.ts`
- Verify: `docs/superpowers/specs/2026-07-31-list-view-toggle-segmented-design.md`

- [ ] **Step 1: Run typecheck and lint**

```bash
npm run typecheck
npx eslint src/components/ListLayout/ListShell.vue tests/unit/components/ListLayout/index.test.ts tests/e2e/responsive-matrix.spec.ts
```

Expected result: both commands exit with code 0 and report no errors.

- [ ] **Step 2: Check focused formatting**

```bash
npx prettier --check \
  src/components/ListLayout/ListShell.vue \
  tests/unit/components/ListLayout/index.test.ts \
  tests/e2e/responsive-matrix.spec.ts \
  docs/superpowers/specs/2026-07-31-list-view-toggle-segmented-design.md \
  docs/superpowers/plans/2026-07-31-list-view-toggle-segmented.md
```

Expected result: all listed files use Prettier formatting.

- [ ] **Step 3: Build the production bundle**

```bash
npm run build
```

Expected result: `vue-tsc --noEmit` and `vite build` both complete successfully.

- [ ] **Step 4: Perform a final manual checklist**

Verify `/categories` and another ListLayout resource at desktop and mobile widths:

- The toggle reads as one control with `Bảng` and `Thẻ` labels.
- Only the selected segment has the white lifted surface.
- The toggle remains secondary to `Thêm mới` and does not stretch full-width.
- Keyboard focus is visible on each button.
- Clicking each option switches views without pagination changes or reloads.
- Card Grid retains its transparent outer surface and DataTable retains its white surface.
