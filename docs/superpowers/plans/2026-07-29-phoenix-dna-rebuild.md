# Phoenix DNA CMS Rebuild Implementation Plan

> **For agentic workers:** Execute the plan in dependency order. This repository is under a strict no-Git-command rule; do not run Git commands or create commits.

**Goal:** Rebuild every CMS_2 presentation family around Phoenix v1.24.0 anatomy and responsive behavior while preserving existing CMS routes, permissions, services, stores, and API contracts.

**Architecture:** Phoenix is the sole visual source of truth. CMS-specific classes may express a business concern or bind a test selector, but they must not define a parallel visual system when Phoenix has a native primitive. The application shell and shared page primitives become the single rendering layer consumed by route views; resource definitions and stores remain the single source of truth for data and authorization.

---

## Audit Baseline

- Phoenix reference at desktop uses a `navbar navbar-vertical navbar-expand-lg` at 254px, a `navbar navbar-top fixed-top navbar-expand` at 64px, and a `.content` canvas beginning at x=254px.
- CMS_2 currently retains a custom fixed shell (`cms-app-content`, `cms-sidebar`, `cms-topbar`), custom page-header/list-card/drawer styling, and custom responsive table replacement. That is the root cause of the visual mismatch.

## Work Matrix

| Family | Route consumers | Phoenix source anatomy | CMS behavior retained |
| --- | --- | --- | --- |
| Application shell | all authenticated routes | vertical navbar, top navbar, `.content`, native mobile collapse/offcanvas | navigation visibility, theme, global search, profile actions, logout |
| Resource lists | categories, customers, sources, orders, warehouse, users, roles | page header, `card`, card header controls, responsive table, dropdown actions, card footer pagination | resource definition, filters, sorting, row permissions, CRUD actions |
| Forms and drawers | categories, users, roles, warehouse, orders, password | card header/body/footer, Bootstrap offcanvas/modal | validation, submit state, API calls, access control |
| Dashboard | dashboard | Phoenix content header, grid/card rhythm, tables/charts | metrics, alerts, ranking, chart data |
| Detail and states | orders, warehouse, profile, missing, 403, loading/empty/error | Phoenix cards, media, alerts, empty states | entity data, navigation, recovery actions |
| Authentication | login | Phoenix simple sign-in page anatomy | redirect validation, API login, password visibility, errors |

## Task 1: Establish a Phoenix-native shell contract

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/app/Header.vue`
- Modify: `src/components/app/Sidebar.vue`
- Modify: `src/components/app/MobileNavDrawer.vue`
- Modify: `src/components/app/Footer.vue`
- Modify: `src/styles/_layout.scss`
- Modify: `src/styles/_components.scss`

- [ ] Write failing tests for `.content` ownership, Phoenix navbar hierarchy, desktop geometry, and native mobile offcanvas anatomy.
- [ ] Run focused tests and confirm the current custom-shell implementation fails the new contract.
- [ ] Replace the custom visual layout with Phoenix shell markup; retain only CMS state, data attributes, and event handlers.
- [ ] Remove custom layout rules that redefine Phoenix geometry; keep narrow product-brand token overrides only.

## Task 2: Establish Phoenix page primitives

**Files:**
- Modify: `src/components/app/PageHeader.vue`
- Modify: `src/components/ListLayout/index.vue`
- Modify: `src/components/Table/DataTable.vue`
- Modify: `src/components/Table/ResponsiveCardList.vue`
- Modify: `src/components/Table/RowActionMenu.vue`
- Modify: `src/components/Pagination/index.vue`
- Modify: `src/components/placeholder/EmptyState.vue`
- Modify: `src/components/placeholder/LoadingSkeleton.vue`

- [ ] Write failing anatomy tests for Phoenix breadcrumb/title rhythm, card header/body/footer, table classes, dropdown action menu, and responsive replacement.
- [ ] Run focused tests and confirm they fail against the current bespoke anatomy.
- [ ] Render every list through one Phoenix page primitive; parameterize resource-specific labels and actions rather than duplicating markup.
- [ ] Replace custom cards/table spacing/reveal controls with Phoenix component classes and only add CSS where Phoenix has no equivalent.

## Task 3: Convert dashboard to Phoenix dashboard composition

**Files:**
- Modify: `src/views/Dashboard/index.vue`
- Modify: `src/views/Dashboard/components/KpiCard.vue`
- Modify: `src/views/Dashboard/components/DashboardRanking.vue`
- Modify: `src/views/Dashboard/components/DashboardAlerts.vue`
- Modify: `src/views/Dashboard/components/RevenueChart.vue`

- [ ] Write failing tests for native Phoenix content/header/card hierarchy and a single responsive grid declaration.
- [ ] Run the focused test to establish the existing divergence.
- [ ] Recompose dashboard cards, ranking, alerts, and chart containers using Phoenix grid/card anatomy while keeping dashboard store data and links unchanged.
- [ ] Centralize status and color mappings so chart/cards do not introduce parallel local palettes.

## Task 4: Convert form, drawer, modal, detail, and media primitives

**Files:**
- Modify: `src/components/FormLayout/index.vue`
- Modify: `src/components/overlay/DrawerPanel.vue`
- Modify: `src/components/overlay/ConfirmDialog.vue`
- Modify: `src/components/media/ImageUploader.vue`
- Modify: `src/components/media/ImagePreview.vue`
- Modify: `src/views/Orders/components/OrderForm.vue`
- Modify: `src/views/WarehousedGoods/components/WarehouseForm.vue`
- Modify: `src/views/Orders/detail.vue`
- Modify: `src/views/WarehousedGoods/detail.vue`
- Modify: `src/views/Account/Profile.vue`
- Modify: `src/views/Account/ChangePassword.vue`

- [ ] Write failing form/offcanvas/modal/detail anatomy tests that assert actual Bootstrap/Phoenix structures and existing behavior events.
- [ ] Run focused tests and verify that the current custom overlay/card structures fail.
- [ ] Convert shared overlays first, then convert every consumer without copying markup; preserve validators, submit handlers, and page-specific business rules.
- [ ] Normalize detail/media cards around the same Phoenix spacing and card hierarchy.

## Task 5: Complete account, authentication, error, and state parity

**Files:**
- Modify: `src/views/Account/login.vue`
- Modify: `src/views/Account/components/ProfileMenu.vue`
- Modify: `src/views/Page403.vue`
- Modify: `src/views/Orders/missing.vue`
- Modify: `src/styles/_components.scss`

- [ ] Write failing tests for Phoenix simple-sign-in hierarchy, profile dropdown card hierarchy, and contextual state cards.
- [ ] Run focused tests to verify the baseline mismatch.
- [ ] Reuse Phoenix primitives for these states and retain actual login redirect, permissions, menu actions, and recovery links.
- [ ] Run account/state tests and visual checks at all supported breakpoints.

## Task 6: Route-by-route final verification

**Files:**
- Modify as required only if verification exposes a real regression.

- [ ] Visit every route in the route catalog and compare shell, header, content, cards, controls, state views, and breakpoint behavior to Phoenix reference families.
- [ ] Record any remaining non-Phoenix difference only when it is mandated by CMS business content; otherwise fix it before reporting completion.
