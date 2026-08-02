# Phoenix Project View Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the ListLayout Table/Card Grid switch to match Phoenix Project Card View's compact independent icon controls.

**Architecture:** Preserve `useListViewMode`, persistence, renderer switching, and test IDs. Change only the option presentation configuration and scoped styling in `ListShell.vue`, then update unit and responsive E2E visual-contract assertions.

**Tech Stack:** Vue 3, TypeScript, Phoenix/Bootstrap utility classes, scoped CSS, Vitest, Vue Test Utils, Playwright.

**Project restriction:** Do not run Git commands. Commit steps are intentionally omitted.

---

### Task 1: Capture the Phoenix icon-button contract

**Files:**

- Modify: `tests/unit/components/ListLayout/index.test.ts`
- Test: `tests/unit/components/ListLayout/index.test.ts`

- [ ] Replace visible-label expectations with icon-only and Phoenix class expectations:

```ts
expect(tableToggle.text()).toBe("");
expect(gridToggle.text()).toBe("");
expect(tableToggle.classes()).toEqual(
  expect.arrayContaining([
    "btn",
    "btn-phoenix-primary",
    "px-3",
    "me-1",
    "is-active",
    "border-0",
    "text-body",
  ]),
);
expect(gridToggle.classes()).toEqual(
  expect.arrayContaining(["btn", "btn-phoenix-primary", "px-3"]),
);
```

- [ ] Run `npm run test:unit -- tests/unit/components/ListLayout/index.test.ts` and verify it fails because the current switch still contains visible labels and segmented-control styles.

### Task 2: Implement the two Phoenix view buttons

**Files:**

- Modify: `src/components/ListLayout/ListShell.vue`
- Test: `tests/unit/components/ListLayout/index.test.ts`

- [ ] Render `viewOptions` with the option index, apply `btn btn-phoenix-primary px-3`, add `me-1` except on the final option, and add `border-0 text-body is-active` to the selected option.
- [ ] Remove the visible label span while retaining `aria-label`, `aria-pressed`, `title`, test IDs, and click handlers.
- [ ] Remove the segmented background, shadow, hover, and visible-label styles. Keep only the inline-flex group and a scoped 10px icon size matching the reference.
- [ ] Run the focused unit test and verify both tests pass.

### Task 3: Verify dimensions and responsive behavior

**Files:**

- Modify: `tests/e2e/responsive-matrix.spec.ts`
- Test: `tests/e2e/responsive-matrix.spec.ts`

- [ ] Replace visible-text assertions with accessible-label assertions and verify the group height is at most 38px.
- [ ] Run targeted ListLayout/Table unit tests, responsive E2E at desktop 1440px and mobile 390px, typecheck, lint, focused Prettier, and production build.
- [ ] Visually compare the final control against Phoenix Project Card View on desktop and mobile, confirming independent buttons, blue bordered inactive state, borderless dark active state, and no horizontal overflow.
