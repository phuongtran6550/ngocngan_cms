# ListLayout ALL Summary Toolbar Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax and must be executed in order. No Git commands or commit steps are included because the project instructions prohibit Git operations.

**Goal:** Add an informational `ALL (total)` summary on the left side of the shared ListLayout toolbar while keeping the `Bảng / Thẻ` view selector on the right.

**Architecture:** Reuse the existing `pagination.total` prop in `ListShell.vue`; do not add a new count prop, request, or filter state. Add one semantic summary element before the existing filter slot and keep the current right-side action/view cluster unchanged, with scoped CSS controlling alignment and non-wrapping behavior.

**Tech Stack:** Vue 3, TypeScript, scoped CSS, Vitest, Vue Test Utils, Playwright, Vite.

---

### Task 1: Lock the total summary contract with a failing unit test

**Files:**

- Modify: `tests/unit/components/ListLayout/index.test.ts`
- Test: `tests/unit/components/ListLayout/index.test.ts`

- [ ] **Step 1: Add visible summary and accessibility assertions**

In the existing switching test, get the summary by test ID and assert it before the view switch:

```ts
const totalSummary = wrapper.get('[data-testid="list-total-summary"]');

expect(totalSummary.text()).toBe("ALL (1)");
expect(totalSummary.attributes("aria-label")).toBe("Tổng số bản ghi: 1");
```

Keep the existing `Bảng / Thẻ`, `aria-pressed`, persistence, and renderer assertions unchanged. After clicking `gridToggle`, assert the summary remains `ALL (1)` so switching modes cannot mutate the count.

- [ ] **Step 2: Run the focused test and verify it fails for the missing summary**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/index.test.ts
```

Expected result before production changes: the test fails because `[data-testid="list-total-summary"]` does not exist.

---

### Task 2: Render the informational summary and align the toolbar

**Files:**

- Modify: `src/components/ListLayout/ListShell.vue:70-84,282-340`
- Test: `tests/unit/components/ListLayout/index.test.ts`

- [ ] **Step 1: Add the summary before the existing filter slot**

Insert this element as the first child of the existing `d-flex flex-wrap align-items-center gap-3` toolbar row, before the optional `$slots.filters` block:

```vue
<div
  class="list-total-summary"
  data-testid="list-total-summary"
  :aria-label="`Tổng số bản ghi: ${pagination.total}`"
>
  <span class="list-total-summary__label">ALL</span>
  <span class="list-total-summary__count">({{ pagination.total }})</span>
</div>
```

This keeps the count reactive to the existing pagination state and makes no new event or API call.

- [ ] **Step 2: Add scoped summary styles without changing the view selector**

Add these styles before `.list-view-toggle` in `ListShell.vue`:

```css
.list-total-summary {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 2.125rem;
  color: var(--phoenix-body-color);
  font-size: 0.875rem;
  line-height: 1;
  white-space: nowrap;
}

.list-total-summary__label {
  font-weight: 800;
  letter-spacing: 0.01em;
}

.list-total-summary__count {
  color: var(--phoenix-tertiary-color);
  font-weight: 600;
}
```

Do not make the summary a button or link. Keep the existing segmented view control and right-side action cluster unchanged.

- [ ] **Step 3: Run the focused unit test and verify it passes**

Run:

```bash
npm run test:unit -- tests/unit/components/ListLayout/index.test.ts
```

Expected result: both ListShell tests pass, including `ALL (1)`, its ARIA label, view switching, persistence, and unchanged pagination.

---

### Task 3: Add responsive placement coverage

**Files:**

- Modify: `tests/e2e/responsive-matrix.spec.ts:16-48`
- Test: `tests/e2e/responsive-matrix.spec.ts`

- [ ] **Step 1: Assert summary content and left/right placement**

Inside the existing `/categories` branch, add:

```ts
const totalSummary = page.getByTestId("list-total-summary");
await expect(totalSummary).toContainText("ALL");
await expect(totalSummary).toHaveAttribute("aria-label", "Tổng số bản ghi: 1");

const summaryBox = await totalSummary.boundingBox();
const toggleBox = await viewToggle.boundingBox();
expect(summaryBox).not.toBeNull();
expect(toggleBox).not.toBeNull();
expect(summaryBox?.x || 0).toBeLessThan(toggleBox?.x || 0);
```

Keep the existing label, height, focus-ring, renderer, surface, persistence, and overflow assertions. The fixture has one category row, so the expected total is `1` at both tested breakpoints.

- [ ] **Step 2: Run the focused responsive matrix**

Run:

```bash
npx playwright test tests/e2e/responsive-matrix.spec.ts --project=desktop-1440 --project=mobile-390
```

Expected result: `40` responsive checks pass, including summary placement and both view modes.

---

### Task 4: Run final static and production verification

**Files:**

- Verify: `src/components/ListLayout/ListShell.vue`
- Verify: `tests/unit/components/ListLayout/index.test.ts`
- Verify: `tests/e2e/responsive-matrix.spec.ts`
- Verify: `docs/superpowers/specs/2026-07-31-list-layout-all-summary-toolbar-design.md`
- Verify: `docs/superpowers/plans/2026-07-31-list-layout-all-summary-toolbar.md`

- [ ] **Step 1: Run related unit tests, typecheck, lint, and focused formatting**

```bash
npm run test:unit -- \
  tests/unit/components/ListLayout/index.test.ts \
  tests/unit/components/ListLayout/useListViewMode.test.ts \
  tests/unit/components/Table/ResourceCardGrid.test.ts
npm run typecheck
npx eslint src/components/ListLayout/ListShell.vue tests/unit/components/ListLayout/index.test.ts tests/e2e/responsive-matrix.spec.ts
npx prettier --check \
  src/components/ListLayout/ListShell.vue \
  tests/unit/components/ListLayout/index.test.ts \
  tests/e2e/responsive-matrix.spec.ts \
  docs/superpowers/specs/2026-07-31-list-layout-all-summary-toolbar-design.md \
  docs/superpowers/plans/2026-07-31-list-layout-all-summary-toolbar.md
```

Expected result: related tests and all static checks exit with code 0.

- [ ] **Step 2: Build the production bundle**

```bash
npm run build
```

Expected result: `vue-tsc --noEmit` and `vite build` complete successfully.

- [ ] **Step 3: Perform a final visual checklist**

Verify `/categories` and a resource with filters at desktop and mobile widths:

- `ALL (total)` is visible on the left and remains non-clickable.
- `Bảng / Thẻ` remains on the right with the existing active state.
- Filters and action slots do not overlap or create horizontal overflow.
- The Card Grid transparent surface and DataTable white surface remain unchanged.
