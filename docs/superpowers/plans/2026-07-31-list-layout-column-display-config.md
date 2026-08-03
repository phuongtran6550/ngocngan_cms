# ListLayout Column Display Config Implementation Plan

> **For agentic workers:** Execute inline in this session. Steps use checkbox (`- [ ]`) syntax. Do not run Git commands because repository instructions prohibit them.

**Goal:** Add `displayIn?: "both" | "table" | "card"` to shared column definitions and apply it consistently to DataTable and Card Grid.

**Architecture:** Extend the shared column type, centralize renderer visibility in one pure helper, and have both list renderers filter through that helper. Existing columns default to both renderers, so current screens do not change until they opt into the new config.

---

### Task 1: Lock the shared visibility contract

**Files:**

- Create: `src/components/Table/column-visibility.ts`
- Modify: `src/config/resource.ts`

- [ ] Add failing tests for default/both, table-only, card-only, and `visible: false` behavior.
- [ ] Run the focused helper test and confirm the missing contract fails.
- [ ] Add `ColumnDisplayMode`, `displayIn`, and the shared `isColumnVisibleIn` helper.
- [ ] Run the focused helper test and confirm it passes.

### Task 2: Apply the contract to both renderers

**Files:**

- Modify: `src/components/Table/DataTable.vue`
- Modify: `src/components/Table/ResourceCardGrid.vue`

- [ ] Add failing renderer tests proving `table` and `card` columns appear only in their assigned renderer.
- [ ] Run both focused renderer test files and confirm the new assertions fail.
- [ ] Replace duplicated `visible !== false` filters with the shared helper.
- [ ] Run both focused renderer test files and confirm all tests pass.

### Task 3: Verify compatibility

**Files:**

- Verify: `src/config/resource.ts`
- Verify: `src/components/Table/column-visibility.ts`
- Verify: `src/components/Table/DataTable.vue`
- Verify: `src/components/Table/ResourceCardGrid.vue`

- [ ] Run typecheck, ESLint, and Prettier checks.
- [ ] Run the production build.
