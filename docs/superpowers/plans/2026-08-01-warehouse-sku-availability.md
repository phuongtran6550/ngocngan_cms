# Warehouse SKU Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Subagents and Git commands are prohibited by the workspace instructions.

**Goal:** Make the SKU code displayed on the warehouse create form match the database-aware code that will be persisted, while never silently changing manual codes.

**Architecture:** Add one batch availability endpoint that reuses the API allocation helper and returns ordered results. Integrate it into the create form with debounce, cancellation, stale-response protection, an immediate pre-submit check, and explicit per-SKU status messages.

**Tech Stack:** Node.js, Express Validator, Mongoose, Vue 3 Options API, Axios, Vitest, Node test runner, Playwright.

---

### Task 1: API contract and allocation service

**Files:**

- Modify: `Version2/API_2/tests/inventory/inventory-service.test.js`
- Modify: `Version2/API_2/tests/inventory/inventory-routes.test.js`
- Modify: `Version2/API_2/Components/Service/InventoryService.js`
- Modify: `Version2/API_2/Controller/WarehousedGoodController/Models/index.js`
- Modify: `Version2/API_2/Controller/WarehousedGoodController/index.js`
- Modify: `Version2/API_2/Controller/WarehousedGoodController/Route.js`
- Modify: `Version2/API_2/Controller/WarehousedGoodController/Validator.js`
- Modify: `Version2/API_2/Controller/WarehousedGoodController/Transformers/index.js`

- [ ] Add failing tests for `checkSkuCodes([{ code, codeMode }])`, ordered suffix allocation, manual conflict metadata, route authentication, and validator limits.
- [ ] Run `node --test tests/inventory/inventory-service.test.js tests/inventory/inventory-routes.test.js` and confirm the new tests fail because the endpoint and service method do not exist.
- [ ] Add `POST sku-codes/check` before dynamic routes, protected by `warehouse.create`.
- [ ] Validate an exact `{ skus }` body with 1-100 rows, normalized codes no longer than 100 characters, and `codeMode` in `auto|manual`.
- [ ] Centralize database lookup and allocation in one service method used by both availability checks and persistence.
- [ ] Return `{ requestedCode, code, codeMode, available }` through an explicit transformer.
- [ ] Run the targeted API tests and confirm they pass.

### Task 2: Persistence semantics for manual and automatic codes

**Files:**

- Modify: `Version2/API_2/tests/inventory/inventory-service.test.js`
- Modify: `Version2/API_2/Components/Service/InventoryService.js`
- Modify: `Version2/CMS_2/src/views/WarehousedGoods/service.ts`

- [ ] Add a failing test proving an existing manual code returns a typed conflict while an automatic code is suffixed.
- [ ] Include `codeMode` in multipart SKU rows without persisting it in MongoDB.
- [ ] Reject a manual allocation change with `DUPLICATE_INVENTORY_SKU`; preserve automatic allocation and duplicate-key retry.
- [ ] Run the targeted API tests and confirm they pass.

### Task 3: CMS API client and stable generated-code state

**Files:**

- Modify: `Version2/CMS_2/tests/unit/views/WarehousedGoods/warehouse.service.test.ts`
- Modify: `Version2/CMS_2/tests/unit/views/WarehousedGoods/sku-code.test.ts`
- Modify: `Version2/CMS_2/src/views/WarehousedGoods/types.ts`
- Modify: `Version2/CMS_2/src/views/WarehousedGoods/service.ts`
- Modify: `Version2/CMS_2/src/views/WarehousedGoods/sku-code.ts`

- [ ] Add failing tests for the POST contract and preservation of a checked code while its generated source is unchanged.
- [ ] Add response types and `warehouseService.checkSkuCodes(skus, signal)`.
- [ ] Add local `codeSource` and update `suggestSkuCodes` so source changes regenerate codes while unrelated edits preserve checked allocations.
- [ ] Run the targeted CMS helper and service tests and confirm they pass.

### Task 4: Create-form availability UX

**Files:**

- Modify: `Version2/CMS_2/tests/unit/views/WarehousedGoods/components/WarehouseCreateForm.test.ts`
- Modify: `Version2/CMS_2/src/views/WarehousedGoods/components/WarehouseCreateForm.vue`

- [ ] Add failing tests for automatic adjustment with explanation, unchanged manual conflicts, submission blocking, immediate checking, and failed checks.
- [ ] Debounce availability requests, cancel obsolete requests, and ignore stale responses.
- [ ] Apply returned codes only to automatic rows; show per-row checking/success/warning/error text.
- [ ] Perform a fresh immediate check in `submit()` and emit only when every manual code is available.
- [ ] Clear timers and abort requests when the component unmounts.
- [ ] Run the component tests and confirm they pass.

### Task 5: Browser fixture and verification

**Files:**

- Modify: `Version2/CMS_2/tests/e2e/fixtures.ts`
- Modify: `Version2/CMS_2/tests/e2e/warehouse.spec.ts`

- [ ] Extend the mock API with `POST /warehoused-goods/sku-codes/check` using deterministic existing-code allocation.
- [ ] Assert that an existing generated code visibly changes to its available suffix before save and the same code appears on the detail page.
- [ ] Run warehouse unit tests, the complete API suite, typecheck, lint, production build, and warehouse E2E on desktop/mobile.
- [ ] Review all new allocation and request logic for duplicated implementations; keep suffix allocation authoritative in the API helper/service.
