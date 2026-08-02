# Hierarchical Catalog Implementation Plan

> **For agentic workers:** Implement test-first and verify every changed contract before reporting success. Git commands are intentionally excluded by workspace policy.

**Goal:** Deliver separate CRUD resources for Danh muc, Chat lieu and Mau with protected deletion and a Phoenix hierarchy in CMS.

**Architecture:** API exposes three YTPlus controller folders over one category aggregate. CMS has a declarative resource definition and shared Phoenix list primitive, with thin route pages for each resource.

**Tech Stack:** Node.js, Express, express-validator, Mongoose, Vue 3, Pinia, Vue Router, Bootstrap Phoenix, Vitest, Playwright.

---

### Task 1: Establish resource contracts

**Files:**
- Modify: `API_2/Components/Database/Schemas/ProductCategory.js`
- Modify: `API_2/Components/Models/ProductCategory.js`
- Modify: `API_2/Components/Service/ProductCategoryService.js`
- Test: `API_2/tests/categories/*.test.js`

- [ ] Add `pattern` to the schema enum and preserve unique `(type, normalizedName)` identity.
- [ ] Make service resources type-scoped and reject cross-resource records as not found.
- [ ] Aggregate warehouse and OrderItem relations under the existing mutation guard.

### Task 2: Add YTPlus resource controllers

**Files:**
- Create: `API_2/Controller/CategoryController/*`
- Create: `API_2/Controller/MaterialController/*`
- Create: `API_2/Controller/PatternController/*`
- Test: `API_2/tests/categories/catalog-controller-contract.test.js`

- [ ] Create dedicated `index.js`, `Route.js`, `Validator.js`, `Models/index.js` and `Transformers/index.js` for every resource.
- [ ] Register CRUD endpoints through filesystem discovery and reuse existing permissions.

### Task 3: Link patterns to inventory

**Files:**
- Modify: `API_2/Components/Database/Schemas/WarehousedGood.js`
- Modify: `API_2/Components/Models/WarehousedGood.js`
- Modify: `API_2/Components/Service/InventoryService.js`
- Modify: `API_2/Controller/WarehousedGoodController/{Validator.js,Transformers/index.js}`
- Test: `API_2/tests/inventory/*.test.js`

- [ ] Persist, populate, validate, filter and transform `patternId` / `pattern` exactly as existing category relations.

### Task 4: Rebuild CMS catalog navigation and pages

**Files:**
- Modify: `CMS_2/src/router/client.ts`, `CMS_2/src/config/navigation.ts`, `CMS_2/src/components/app/Sidebar.vue`
- Create/modify: `CMS_2/src/views/{Categories,Materials,Patterns}/...`
- Test: `CMS_2/tests/unit/{config,navigation,router,views/Categories}/...`

- [ ] Derive a parent `Danh muc` menu with three permission-aware children.
- [ ] Render each child as an independent Phoenix list/drawer page with fixed endpoint and resource labels.

### Task 5: Surface pattern in warehouse and verify end to end

**Files:**
- Modify: `CMS_2/src/views/WarehousedGoods/...`
- Modify: `CMS_2/tests/browser/mock-api.mjs`, `CMS_2/tests/e2e/...`
- Test: focused unit tests, API suite, CMS build/lint/typecheck and Playwright.

- [ ] Add Mẫu selectors, table/filter/detail fields and multipart payload support.
- [ ] Confirm CRUD, deletion rejection, hierarchy keyboard/mouse behavior and responsive views.
