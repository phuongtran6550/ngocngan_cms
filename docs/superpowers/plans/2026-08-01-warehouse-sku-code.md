# Warehouse SKU Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add readable, editable, globally unique codes to every newly created warehouse SKU and display the current code in each pricing explanation card and on the product detail page.

**Architecture:** The CMS owns deterministic suggestions from category, material, pattern, weight, and size through one pure utility. The API owns normalization, global suffix allocation, persistence, and concurrency retries through one shared helper plus repository lookup. Existing product-level `code` mirrors the first SKU for compatibility, while legacy embedded SKUs without codes remain readable.

**Tech Stack:** Vue 3 Options API, TypeScript, Vitest, Axios multipart forms, Node.js ES modules, Express Validator, Mongoose, Node test runner, Playwright.

**Repository Policy:** Do not run Git commands. Replace commit steps with explicit test checkpoints because `/Users/phuongtran/Documents/Freelance/NgocChau/AGENTS.md` forbids all Git operations.

---

### Task 1: CMS SKU Code Utility and Types

**Files:**

- Create: `Version2/CMS_2/src/views/WarehousedGoods/sku-code.ts`
- Create: `Version2/CMS_2/tests/unit/views/WarehousedGoods/sku-code.test.ts`
- Modify: `Version2/CMS_2/src/views/WarehousedGoods/types.ts`

- [ ] **Step 1: Write failing pure-function tests**

Cover Vietnamese abbreviation, preserved digits, weight, size, full code, duplicate automatic rows, and manual reservations:

```ts
expect(abbreviateSkuPart("Nhẫn")).toBe("NH");
expect(abbreviateSkuPart("Dây chuyền")).toBe("DC");
expect(abbreviateSkuPart("Bạc 925")).toBe("B925");
expect(formatSkuWeight(1.5)).toBe("1P5C");
expect(formatSkuSize("Ni 12")).toBe("N12");
expect(
  buildSkuCode({
    category: "Nhẫn",
    material: "Bạc 925",
    pattern: "Bông mai",
    weight: 1.5,
    size: "Ni 12",
  }),
).toBe("NH-B925-BM-1P5C-N12");
```

Test that `suggestSkuCodes` preserves a manual code and assigns `-02` to an automatic collision.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run tests/unit/views/WarehousedGoods/sku-code.test.ts
```

Expected: FAIL because `@/views/WarehousedGoods/sku-code` does not exist.

- [ ] **Step 3: Implement the centralized CMS utility**

Export these interfaces and functions:

```ts
export interface SkuCodeSource {
  category: string;
  material: string;
  pattern: string;
  weight: number;
  size: string;
}

export function normalizeSkuCode(value: unknown): string;
export function abbreviateSkuPart(value: unknown): string;
export function formatSkuWeight(value: unknown): string;
export function formatSkuSize(value: unknown): string;
export function buildSkuCode(source: SkuCodeSource): string;
export function suggestSkuCodes(
  skus: WarehouseSkuFormModel[],
  context: Omit<SkuCodeSource, "weight" | "size">,
): WarehouseSkuFormModel[];
```

Use Unicode NFD normalization, explicit `đ/Đ` replacement, uppercase ASCII, hyphen-separated segments, and row-order suffixes padded to two digits. Reserve normalized manual codes before assigning automatic codes so manual values are never overwritten.

- [ ] **Step 4: Extend warehouse SKU types**

Add the persisted code and form-only mode:

```ts
export interface WarehouseSku {
  id: string;
  code: string;
  // existing fields
}

export interface WarehouseSkuFormModel extends Omit<WarehouseSku, "id"> {
  clientId: string;
  id?: string;
  codeMode: "auto" | "manual";
}
```

`emptyWarehouseSku()` defaults to `code: ""` and `codeMode: "auto"`; mapped persisted rows default to `codeMode: "manual"` so editing an existing item does not unexpectedly regenerate identifiers.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
npx vitest run tests/unit/views/WarehousedGoods/sku-code.test.ts
npm run typecheck
```

Expected: PASS.

### Task 2: Create Form Automatic and Manual Code Behavior

**Files:**

- Modify: `Version2/CMS_2/src/views/WarehousedGoods/components/WarehouseCreateForm.vue`
- Modify: `Version2/CMS_2/tests/unit/views/WarehousedGoods/components/WarehouseCreateForm.test.ts`

- [ ] **Step 1: Write failing form tests**

Add tests that select `Nhẫn`, `Bạc 925`, `Bông mai`, enter `1.5` and `Ni 12`, then assert:

```ts
expect(
  wrapper.get<HTMLInputElement>('input[name="skus[0].code"]').element.value,
).toBe("NH-B925-BM-1P5C-N12");
expect(wrapper.get('[data-testid="pricing-sku-code-0"]').text()).toContain(
  "NH-B925-BM-1P5C-N12",
);
```

Add separate tests for:

- A second identical automatic SKU receives `-02`.
- Typing `CUSTOM-01` keeps that value after changing pattern.
- Clicking `Tạo lại mã SKU 1` restores the generated value.
- Empty code and duplicate manual code block submission with the exact row message.

- [ ] **Step 2: Run the component test and verify RED**

Run:

```bash
npx vitest run tests/unit/views/WarehousedGoods/components/WarehouseCreateForm.test.ts
```

Expected: FAIL because SKU code inputs and pricing badges are absent.

- [ ] **Step 3: Add the SKU code input and pricing-card display**

At the top of each SKU field grid, render:

```vue
<label class="form-label" :for="skuFieldId(index, 'code')">
  Mã SKU <span class="text-danger">*</span>
</label>
<div class="input-group">
  <input
    :id="skuFieldId(index, 'code')"
    class="form-control font-monospace text-uppercase"
    :name="`skus[${index}].code`"
    :value="sku.code"
    maxlength="100"
    required
    @input="updateSkuCode(index, $event)"
    @blur="normalizeManualSkuCode(index)"
  />
  <button
    type="button"
    class="btn btn-phoenix-secondary"
    :aria-label="`Tạo lại mã SKU ${index + 1}`"
    @click="regenerateSkuCode(index)"
  >
    Tạo lại mã
  </button>
</div>
```

Inside `data-testid="pricing-formula-<index>"`, render one reactive source value:

```vue
<code :data-testid="`pricing-sku-code-${index}`" class="pricing-sku-code">
  {{ sku.code || "Chưa có mã SKU" }}
</code>
```

- [ ] **Step 4: Centralize all derived row updates**

Import `normalizeSkuCode` and `suggestSkuCodes`. Add `withDerivedSkuValues(input)` that first recalculates prices and then regenerates codes only for rows with `codeMode === "auto"`. Route catalog changes, size changes, weight changes, add, remove, and reset through this one function.

Use option lookup helpers to obtain selected names:

```ts
optionName(options: InventoryOption[], id: string): string {
  return options.find((option) => option.id === id)?.name || "";
}
```

Manual input sets `codeMode: "manual"`; the reset action sets `codeMode: "auto"` before recomputing all automatic suffixes.

- [ ] **Step 5: Add form validation**

Before weight and import-price checks, normalize every code and reject:

```ts
SKU 1: Mã SKU là bắt buộc
SKU 2: Mã SKU "NH-B925-BM-1P5C-N12" bị trùng
```

Compare normalized values so casing, accents, spaces, and punctuation cannot bypass duplicate detection.

- [ ] **Step 6: Style and verify the focused form suite**

Add compact responsive styles for `.sku-code-field` and `.pricing-sku-code`, ensuring the badge wraps safely rather than widening the page.

Run:

```bash
npx vitest run tests/unit/views/WarehousedGoods/components/WarehouseCreateForm.test.ts
```

Expected: PASS.

### Task 3: CMS Serialization and Detail Display

**Files:**

- Modify: `Version2/CMS_2/src/views/WarehousedGoods/service.ts`
- Modify: `Version2/CMS_2/src/views/WarehousedGoods/detail.vue`
- Modify: `Version2/CMS_2/tests/unit/views/WarehousedGoods/warehouse.service.test.ts`
- Modify: `Version2/CMS_2/tests/unit/views/WarehousedGoods/pages/WarehouseDetailPage.test.ts`
- Modify: `Version2/CMS_2/tests/e2e/fixtures.ts`

- [ ] **Step 1: Write failing serializer and detail tests**

Assert multipart JSON includes `code`:

```ts
expect(JSON.parse(String(body.get("skus")))[0].code).toBe(
  "NH-B925-BM-1P5C-N12",
);
```

Give the detail fixture two codes and assert both persisted values are visible instead of `#1` and `#2`.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npx vitest run tests/unit/views/WarehousedGoods/warehouse.service.test.ts tests/unit/views/WarehousedGoods/pages/WarehouseDetailPage.test.ts
```

Expected: FAIL because serialization and detail cells omit `code`.

- [ ] **Step 3: Serialize and display the code**

Include `code` in the SKU object produced by `multipart()`. Replace the detail row number badge with:

```vue
<td>
  <code class="sku-code-cell">{{ sku.code || "—" }}</code>
</td>
```

The computed legacy row uses `code: this.item.code || ""`.

- [ ] **Step 4: Update browser fixtures**

Add `code` to seeded `warehouseRows[].skus[]`, parse it from multipart `fields.skus`, and mirror the first parsed SKU code to `updated.code` in the mock API response.

- [ ] **Step 5: Run the focused CMS tests**

Run:

```bash
npx vitest run tests/unit/views/WarehousedGoods/warehouse.service.test.ts tests/unit/views/WarehousedGoods/pages/WarehouseDetailPage.test.ts
```

Expected: PASS.

### Task 4: API Code Normalization, Allocation, Schema, and Repository

**Files:**

- Create: `Version2/API_2/Components/Helper/inventorySkuCode.js`
- Create: `Version2/API_2/tests/inventory/inventory-sku-code.test.js`
- Modify: `Version2/API_2/Components/Database/Schemas/WarehousedGood.js`
- Modify: `Version2/API_2/Components/Models/WarehousedGood.js`
- Modify: `Version2/API_2/tests/inventory/inventory-repository.test.js`

- [ ] **Step 1: Write failing API helper tests**

Test normalization and allocation:

```js
assert.equal(normalizeSkuCode(" nh-bạc 925 "), "NH-BAC-925");
assert.deepEqual(
  allocateSkuCodes(
    ["NH-B925-BM-1P5C-N12", "NH-B925-BM-1P5C-N12"],
    ["NH-B925-BM-1P5C-N12", "NH-B925-BM-1P5C-N12-02"],
  ),
  ["NH-B925-BM-1P5C-N12-03", "NH-B925-BM-1P5C-N12-04"],
);
```

Also test `isSkuCodeDuplicateError` only accepts Mongo duplicate-key errors targeting `skus.code`.

- [ ] **Step 2: Run helper tests and verify RED**

Run:

```bash
node --test tests/inventory/inventory-sku-code.test.js
```

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement the API helper**

Export:

```js
export function normalizeSkuCode(value) {}
export function skuCodeBase(value) {}
export function allocateSkuCodes(requestedCodes, existingCodes = []) {}
export function isSkuCodeDuplicateError(error) {}
```

Allocation keeps an unused base, otherwise uses the smallest free integer suffix from `02`, with deterministic row order.

- [ ] **Step 4: Add embedded code and the partial unique index**

Extend `warehouseSkuSchema`:

```js
code: { type: String, trim: true, maxlength: 100 }
```

Add:

```js
warehousedGoodSchema.index(
  { "skus.code": 1 },
  {
    unique: true,
    partialFilterExpression: { "skus.code": { $type: "string" } },
  },
);
```

- [ ] **Step 5: Add repository lookup and its failing/passing test**

Implement:

```js
async findSkuCodesByBases(bases, { excludeId, session } = {})
```

Build escaped regular expressions matching each base and optional numeric suffix, exclude the current `_id` on update, select only `skus.code`, and flatten returned embedded rows to strings.

Run:

```bash
node --test tests/inventory/inventory-repository.test.js tests/inventory/inventory-sku-code.test.js
```

Expected: PASS.

### Task 5: API Validation and Inventory-Service Allocation

**Files:**

- Modify: `Version2/API_2/Controller/WarehousedGoodController/Validator.js`
- Modify: `Version2/API_2/Components/Service/InventoryService.js`
- Modify: `Version2/API_2/tests/inventory/inventory-routes.test.js`
- Modify: `Version2/API_2/tests/inventory/inventory-service.test.js`

- [ ] **Step 1: Write failing route validation tests**

For create requests, verify every SKU requires a code and rejects normalized values over 100 characters. Verify a PATCH containing legacy rows without codes remains valid.

- [ ] **Step 2: Run route tests and verify RED**

Run:

```bash
node --test tests/inventory/inventory-routes.test.js
```

Expected: FAIL because `validateSkus` does not inspect `sku.code`.

- [ ] **Step 3: Implement validator rules using the shared helper**

Import `normalizeSkuCode`. On POST, require every normalized code. On PATCH, permit absent codes for legacy compatibility but validate any non-empty submitted code. Reject raw or normalized values over 100 characters with row-specific Vietnamese messages.

- [ ] **Step 4: Write failing service tests**

Add tests proving:

- Submitted SKU codes are normalized.
- Existing `BASE` and `BASE-02` cause `BASE-03`.
- Two equal rows in one request get deterministic suffixes.
- Product-level `code` mirrors the first allocated SKU code.
- Update excludes codes owned by the current product.
- Duplicate-key error retries allocation and does not save/remove the uploaded thumbnail twice.

- [ ] **Step 5: Add `code` to normalized SKU data and legacy field mirroring**

In `normalizeSku`, include `code` only when normalization returns a non-empty value. Add `code` to `SKU_FIELDS` and `pricingUpdate`. Keep blank legacy codes omitted rather than persisted as empty strings.

- [ ] **Step 6: Centralize allocation in the service**

Add a class method:

```js
async withAllocatedSkuCodes(input, { excludeId, session } = {}) {
  if (!Array.isArray(input.skus) || !input.skus.length) return input;
  const requested = input.skus.map((sku) => sku.code || '');
  const bases = [...new Set(requested.filter(Boolean).map(skuCodeBase))];
  const existing = bases.length
    ? await this.model.findSkuCodesByBases(bases, { excludeId, session })
    : [];
  const allocated = allocateSkuCodes(requested, existing);
  const skus = input.skus.map((sku, index) =>
    allocated[index] ? { ...sku, code: allocated[index] } : sku
  );
  return { ...input, code: skus[0]?.code || input.code || '', skus };
}
```

Call it after relation normalization and before pricing on create and whenever update includes `skus` or legacy SKU fields.

- [ ] **Step 7: Retry duplicate-key races**

Wrap each complete create/update mutation attempt in a maximum three-attempt loop. On `isSkuCodeDuplicateError`, start a fresh repository lookup and relation mutation; rethrow all unrelated errors immediately. Keep the uploaded thumbnail outside the retry loop so it is saved once and only removed if no persistence attempt succeeds.

- [ ] **Step 8: Run API route and service tests**

Run:

```bash
node --test tests/inventory/inventory-routes.test.js tests/inventory/inventory-service.test.js tests/inventory/inventory-sku-code.test.js
```

Expected: PASS.

### Task 6: API Transformer and Search

**Files:**

- Modify: `Version2/API_2/Controller/WarehousedGoodController/Transformers/index.js`
- Modify: `Version2/API_2/Components/Service/InventoryService.js`
- Modify: `Version2/API_2/tests/inventory/inventory-transformer.test.js`
- Modify: `Version2/API_2/tests/inventory/inventory-service.test.js`

- [ ] **Step 1: Write failing transformer and search tests**

Assert embedded `code` is exposed without `_id`, the synthetic first legacy row can use product-level `code`, and `buildFilter` sends a query containing `{ 'skus.code': rawPattern }`.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node --test tests/inventory/inventory-transformer.test.js tests/inventory/inventory-service.test.js
```

Expected: FAIL because transformer and filter omit embedded codes.

- [ ] **Step 3: Add transformer and search behavior**

Return `code: String(value?.code || '')` from `sku()`. Pass product-level `code` into the synthetic legacy SKU. Add `{ 'skus.code': rawPattern }` to the list filter `$or` array.

- [ ] **Step 4: Run the complete API inventory suite**

Run:

```bash
node --test tests/inventory/*.test.js
```

Expected: all inventory tests PASS.

### Task 7: End-to-End Create and Detail Flow

**Files:**

- Modify: `Version2/CMS_2/tests/e2e/warehouse.spec.ts`
- Modify: `Version2/CMS_2/tests/e2e/fixtures.ts`

- [ ] **Step 1: Extend the E2E assertions**

In the existing desktop/mobile create test, assert:

```ts
await expect(page.locator('input[name="skus[0].code"]')).toHaveValue(
  "NH-V18K-BM-1P25C",
);
await expect(page.getByTestId("pricing-sku-code-0")).toHaveText(
  "NH-V18K-BM-1P25C",
);
```

After filling the second row, assert its generated code and pricing card. Override one code manually, change a classification, and confirm the manual value remains. After save, assert the detail table shows both persisted values.

- [ ] **Step 2: Run desktop and mobile E2E and verify behavior**

Run:

```bash
npx playwright test tests/e2e/warehouse.spec.ts -g "creates inventory" --project=desktop-1440 --project=mobile-390
```

Expected: 2 tests PASS with no page errors or horizontal overflow.

### Task 8: Final Verification and DRY Review

**Files:**

- Review all files changed in Tasks 1-7.

- [ ] **Step 1: Format modified files**

Run focused Prettier from `Version2/CMS_2` for CMS TypeScript, Vue, tests, and plan/spec Markdown files.

- [ ] **Step 2: Run the complete relevant CMS suite**

Run:

```bash
npx vitest run tests/unit/views/WarehousedGoods
npm run typecheck
npm run lint
npm run build
```

Expected: all commands PASS.

- [ ] **Step 3: Run the complete API suite**

Run from `Version2/API_2`:

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 4: Run final desktop/mobile warehouse E2E**

Run:

```bash
npx playwright test tests/e2e/warehouse.spec.ts --project=desktop-1440 --project=mobile-390
```

Expected: all warehouse E2E tests PASS.

- [ ] **Step 5: Perform the DRY and scope audit**

Confirm with `rg` that CMS generation exists only in `sku-code.ts`, API allocation exists only in `inventorySkuCode.js`, every multipart SKU carries `code`, no pricing formula changed, no files outside `/Users/phuongtran/Documents/Freelance/NgocChau` were modified, and no Git command was run.
