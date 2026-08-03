# Warehouse SKU Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add readable, editable, globally unique codes to every newly created warehouse SKU and display the current code in each pricing explanation card and on the product detail page.

**Architecture:** The CMS owns deterministic suggestions from category, material, pattern, weight, and size through one pure utility. The API owns normalization, global suffix allocation, persistence, and concurrency retries through one shared helper plus repository lookup. Existing product-level `code` mirrors the first SKU for compatibility, while legacy embedded SKUs without codes remain readable.

**Repository Policy:** Do not run Git commands. Replace commit steps with explicit test checkpoints because `/Users/phuongtran/Documents/Freelance/NgocChau/AGENTS.md` forbids all Git operations.

---

### Task 1: CMS SKU Code Utility and Types

**Files:**

- Create: `Version2/CMS_2/src/views/WarehousedGoods/sku-code.ts`
- Modify: `Version2/CMS_2/src/views/WarehousedGoods/types.ts`

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

### Task 2: Create Form Automatic and Manual Code Behavior

**Files:**

- Modify: `Version2/CMS_2/src/views/WarehousedGoods/components/WarehouseCreateForm.vue`

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

### Task 3: CMS Serialization and Detail Display

**Files:**

- Modify: `Version2/CMS_2/src/views/WarehousedGoods/service.ts`
- Modify: `Version2/CMS_2/src/views/WarehousedGoods/detail.vue`

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

### Task 4: API Code Normalization, Allocation, Schema, and Repository

**Files:**

- Create: `Version2/API_2/Components/Helper/inventorySkuCode.js`
- Modify: `Version2/API_2/Components/Database/Schemas/WarehousedGood.js`
- Modify: `Version2/API_2/Components/Models/WarehousedGood.js`

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

### Task 5: API Validation and Inventory-Service Allocation

**Files:**

- Modify: `Version2/API_2/Controller/WarehousedGoodController/Validator.js`
- Modify: `Version2/API_2/Components/Service/InventoryService.js`

- [ ] **Step 3: Implement validator rules using the shared helper**

Import `normalizeSkuCode`. On POST, require every normalized code. On PATCH, permit absent codes for legacy compatibility but validate any non-empty submitted code. Reject raw or normalized values over 100 characters with row-specific Vietnamese messages.

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

### Task 6: API Transformer and Search

**Files:**

- Modify: `Version2/API_2/Controller/WarehousedGoodController/Transformers/index.js`
- Modify: `Version2/API_2/Components/Service/InventoryService.js`

- [ ] **Step 3: Add transformer and search behavior**

Return `code: String(value?.code || '')` from `sku()`. Pass product-level `code` into the synthetic legacy SKU. Add `{ 'skus.code': rawPattern }` to the list filter `$or` array.

- [ ] **Step 4: Run the complete API inventory suite**

Run:

Expected: all inventory tests PASS.

### Task 7: End-to-End Create and Detail Flow

**Files:**

### Task 8: Final Verification and DRY Review

**Files:**

- Review all files changed in Tasks 1-7.

- [ ] **Step 1: Format modified files**

Run focused Prettier from `Version2/CMS_2` for CMS TypeScript, Vue, tests, and plan/spec Markdown files.

- [ ] **Step 2: Run the complete relevant CMS suite**

Run:

Expected: all commands PASS.

- [ ] **Step 3: Run the complete API suite**

Run from `Version2/API_2`:

Expected: all tests PASS.

- [ ] **Step 5: Perform the DRY and scope audit**

Confirm with `rg` that CMS generation exists only in `sku-code.ts`, API allocation exists only in `inventorySkuCode.js`, every multipart SKU carries `code`, no pricing formula changed, no files outside `/Users/phuongtran/Documents/Freelance/NgocChau` were modified, and no Git command was run.
