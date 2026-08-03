# ListLayout ALL Summary Toolbar Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax and must be executed in order. No Git commands or commit steps are included because the project instructions prohibit Git operations.

**Goal:** Add an informational `ALL (total)` summary on the left side of the shared ListLayout toolbar while keeping the `Bảng / Thẻ` view selector on the right.

**Architecture:** Reuse the existing `pagination.total` prop in `ListShell.vue`; do not add a new count prop, request, or filter state. Add one semantic summary element before the existing filter slot and keep the current right-side action/view cluster unchanged, with scoped CSS controlling alignment and non-wrapping behavior.

---

### Task 2: Render the informational summary and align the toolbar

**Files:**

- Modify: `src/components/ListLayout/ListShell.vue:70-84,282-340`

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

### Task 3: Add responsive placement coverage

**Files:**

- [ ] **Step 1: Assert summary content and left/right placement**

Inside the existing `/categories` branch, add:

Keep the existing label, height, focus-ring, renderer, surface, persistence, and overflow assertions. The fixture has one category row, so the expected total is `1` at both tested breakpoints.

- [ ] **Step 2: Run the focused responsive matrix**

Run:

Expected result: `40` responsive checks pass, including summary placement and both view modes.

---

### Task 4: Run final static and production verification

**Files:**

- Verify: `src/components/ListLayout/ListShell.vue`
- Verify: `docs/superpowers/specs/2026-07-31-list-layout-all-summary-toolbar-design.md`
- Verify: `docs/superpowers/plans/2026-07-31-list-layout-all-summary-toolbar.md`

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
