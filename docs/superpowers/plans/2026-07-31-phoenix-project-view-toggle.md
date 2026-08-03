# Phoenix Project View Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the ListLayout Table/Card Grid switch to match Phoenix Project Card View's compact independent icon controls.

**Project restriction:** Do not run Git commands. Commit steps are intentionally omitted.

---

### Task 1: Capture the Phoenix icon-button contract

**Files:**

- [ ] Replace visible-label expectations with icon-only and Phoenix class expectations:

### Task 2: Implement the two Phoenix view buttons

**Files:**

- Modify: `src/components/ListLayout/ListShell.vue`

- [ ] Render `viewOptions` with the option index, apply `btn btn-phoenix-primary px-3`, add `me-1` except on the final option, and add `border-0 text-body is-active` to the selected option.
- [ ] Remove the visible label span while retaining `aria-label`, `aria-pressed`, `title`, test IDs, and click handlers.
- [ ] Remove the segmented background, shadow, hover, and visible-label styles. Keep only the inline-flex group and a scoped 10px icon size matching the reference.

### Task 3: Verify dimensions and responsive behavior

**Files:**

- [ ] Replace visible-text assertions with accessible-label assertions and verify the group height is at most 38px.
- [ ] Visually compare the final control against Phoenix Project Card View on desktop and mobile, confirming independent buttons, blue bordered inactive state, borderless dark active state, and no horizontal overflow.
