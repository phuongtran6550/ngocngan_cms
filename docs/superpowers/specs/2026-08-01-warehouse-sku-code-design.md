# Warehouse SKU Code Design

## Summary

Add a required, human-readable code to every SKU created for a warehoused product. The code is suggested from the selected category, material, pattern, weight in chi, and optional size/ring size. Users can edit the suggestion, while the API remains the final authority for normalization and global uniqueness.

Approved example:

```text
NH-B925-BM-1P5C-N12
```

This represents category `Nhẫn`, material `Bạc 925`, pattern `Bông mai`, weight `1,5 chỉ`, and ring size `Ni 12`.

## Goals

- Give every new SKU its own short code that staff can infer from the physical product.
- Generate useful codes without requiring repetitive manual entry.
- Keep generated codes readable by separating attributes with hyphens.
- Allow an operator to override any generated code intentionally.
- Guarantee that persisted SKU codes are unique across the whole warehouse.
- Make SKU codes visible on the create form and product detail page.
- Include embedded SKU codes in warehouse search.
- Preserve compatibility with existing products whose embedded SKU rows do not yet contain codes.

## Non-Goals

- Adding editable abbreviation fields to category, material, or pattern management pages.
- Renaming or removing the existing product-level `code` field.
- Migrating every legacy SKU to a generated code in this change.
- Changing pricing, stock, image, catalog, or multi-SKU behavior.
- Creating a standalone SKU-management page.

## Code Format

The generated base code uses the following segments:

```text
<CATEGORY>-<MATERIAL>-<PATTERN>-<WEIGHT>[-<SIZE>]
```

Examples:

```text
NH-B925-BM-1P5C-N12
DC-BT-TR-2C
BT-B925-HM-0P75C-S
```

The optional size segment is omitted when the SKU has no size or ring-size value.

### Catalog Abbreviations

A shared abbreviation function normalizes Vietnamese text to uppercase ASCII before creating a segment.

- A single alphabetic word uses its first two characters: `Nhẫn -> NH`, `Trơn -> TR`.
- Multiple words use the first character of each word, up to three letters: `Dây chuyền -> DC`, `Bông mai -> BM`.
- Digits are preserved and appended to the alphabetic abbreviation: `Bạc 925 -> B925`, `Bạc Thái 925 -> BT925`.
- Punctuation and whitespace are removed from the final segment.
- An empty or unusable option name contributes no segment until the user finishes the selection.

The same utility owns abbreviation behavior for category, material, and pattern so the rules cannot drift between form rows or API tests.

### Weight Segment

- Normalize the positive decimal number and remove insignificant trailing zeroes.
- Replace the decimal separator with `P`.
- Append `C` for `chỉ`.
- Examples: `1 -> 1C`, `1.5 -> 1P5C`, `0.75 -> 0P75C`, `2.00 -> 2C`.

### Size Segment

- Trim and normalize the value to uppercase ASCII.
- A numeric value or a value beginning with `Ni` becomes `N<number>`: `12 -> N12`, `Ni 12 -> N12`.
- A non-numeric size is compacted without spaces: `S -> S`, `Size M -> M`.
- An empty size produces no segment.

### Final Normalization

- Convert to uppercase ASCII.
- Permit only `A-Z`, `0-9`, and single hyphens between segments.
- Collapse repeated hyphens and trim leading or trailing hyphens.
- Limit a submitted SKU code to 100 characters, matching the existing product code limit.

## Create Form Behavior

Each SKU card places a required `Mã SKU` text input before size and weight. A compact helper line shows that the suggestion comes from the selected classification and SKU measurements.

The `Cách tính giá SKU <n>` card also displays the current SKU code directly below its title as a high-contrast monospace badge. This value uses the same row state as the editable input, so automatic regeneration and manual edits appear there immediately without a second copy of SKU-code logic. When the code is temporarily empty, the badge shows `Chưa có mã SKU` rather than disappearing.

The form tracks whether each SKU code is automatic or manually overridden:

- A newly created SKU starts in automatic mode.
- Selecting category, material, or pattern updates all automatic SKU codes.
- Changing weight or size updates only that automatic SKU code.
- Typing in the `Mã SKU` input marks that row as manual and stops automatic replacement.
- Clearing a manual code does not silently invent a value while the user is typing; the adjacent `Tạo lại mã` action explicitly restores automatic mode.
- `Tạo lại mã` regenerates the row from the latest product and SKU attributes.
- Removing a SKU re-evaluates generated duplicate suffixes for the remaining automatic rows.
- Manually entered values are normalized on blur and again by the API.

When two rows in the same form produce the same base code, the first keeps the base and later automatic rows receive `-02`, `-03`, and so on. A manual code is never changed by the client solely to resolve a duplicate; form validation instead reports the duplicate so the user understands what happened.

The form cannot submit if a SKU code is empty or two manually resolved rows still have the same normalized code.

## API and Persistence

### Schema

Add `code` to the embedded warehouse SKU schema:

```text
skus[].code: trimmed string, maximum 100 characters
```

The field remains optional at the database-schema level so legacy documents can still be read and updated safely. The create API requires a non-empty code for every submitted SKU row.

Create a partial unique multikey index on `skus.code` for non-empty string values. Service-level validation also checks duplicate codes inside one document because MongoDB unique multikey indexes do not reliably reject duplicate array values within the same document.

### Service Normalization and Allocation

One API utility owns SKU-code normalization, suffix parsing, and next-code allocation.

For every create request:

1. Normalize each submitted code.
2. Resolve duplicates inside the incoming SKU array in row order.
3. Query existing warehouse SKU codes sharing the requested bases.
4. Keep an unused base code when available.
5. Otherwise allocate the first available suffix starting at `-02`.
6. Persist the allocated codes and return them in the response.

Example allocation:

```text
Requested: NH-B925-BM-1P5C-N12
Existing:  NH-B925-BM-1P5C-N12, NH-B925-BM-1P5C-N12-02
Stored:    NH-B925-BM-1P5C-N12-03
```

The database index is the final concurrency guard. If another request wins the same code between lookup and insert, the service retries allocation with the next suffix instead of returning an internal database error.

For update requests, codes already owned by the current product are excluded from the global conflict check. New or changed SKU codes are allocated using the same centralized logic.

### Product-Level Compatibility

The existing product-level `code` remains available for legacy list and integration behavior. For newly created multi-SKU products, it mirrors the persisted code of the first SKU. Updating SKU order or the first SKU code updates the mirrored product-level code through the same inventory service path.

Legacy products are handled as follows:

- Embedded SKU rows without `code` remain readable.
- The transformer exposes an empty embedded code when none exists, except that the first legacy SKU may fall back to the product-level code for display compatibility.
- Creating a new product requires codes for every SKU.
- Updating unrelated fields on a legacy product does not fail merely because old SKU rows have no code.
- Once a legacy SKU list is explicitly edited and submitted with codes, normal uniqueness rules apply.

## Search and Display

- Warehouse search includes `skus.code` in addition to product name, supplier, product-level code, and phone.
- The product detail SKU table displays the persisted code in its `SKU` column instead of a generated row label such as `SKU 1`.
- Every create-form pricing explanation card displays its row's current SKU code below `Cách tính giá SKU <n>`.
- Missing legacy codes display an em dash rather than inventing a non-persisted value.
- The create response and detail transformer expose `skus[].code` to the CMS type model.

## Validation and Errors

- Empty code on create: `SKU <n>: Mã SKU là bắt buộc`.
- More than 100 characters: `SKU <n>: Mã SKU không được vượt quá 100 ký tự`.
- Invalid normalized result: `SKU <n>: Mã SKU không hợp lệ`.
- Duplicate manual codes in the form: identify both the duplicated value and affected row.
- API normalization prevents lowercase, accents, whitespace, or punctuation differences from bypassing uniqueness.
- Expected duplicate-key races are translated into allocation retries; unrelated database errors are not swallowed.

## Testing Strategy

### CMS Unit Tests

- Catalog abbreviation generation, including Vietnamese accents and preserved material digits.
- Weight and size segment formatting.
- Full base-code generation with and without size.
- Automatic updates when classification, weight, or size changes.
- Manual override protection and `Tạo lại mã` behavior.
- Pricing explanation cards reactively display the same generated or manually entered SKU code as their row input.
- In-form suffix allocation for duplicate automatic rows.
- Required and duplicate code validation.
- Multipart serialization includes each SKU code.
- Item-to-form mapping preserves persisted SKU codes.
- Detail page renders persisted SKU codes and legacy fallback behavior.

### API Tests

- Validator accepts normalized valid SKU codes and rejects empty, invalid, or oversized codes.
- Inventory service normalizes codes and mirrors the first SKU code to product `code`.
- Allocation keeps a free base and adds `-02`, `-03` for conflicts.
- Multiple identical codes in one request receive deterministic suffixes.
- Update excludes codes already owned by the current product.
- Transformer exposes embedded SKU codes.
- Search filter matches `skus.code`.
- Repository/schema tests cover the new lookup and partial unique index behavior.
- Legacy documents without embedded codes remain readable and can receive unrelated updates.

### End-to-End Tests

- Creating a product shows automatically generated codes for two SKUs.
- Changing size or weight updates only the appropriate automatic row.
- Manual override survives later classification changes.
- Each pricing explanation card shows the matching SKU code on desktop and mobile.
- Saved product detail shows the final API-returned SKU codes.
- Desktop and mobile flows remain usable without horizontal overflow.

## Implementation Boundaries

- Centralize CMS generation and normalization in one warehouse SKU-code utility.
- Centralize API normalization and global allocation in one inventory SKU-code service/helper.
- Extend existing warehouse types, serializer, form, detail page, validator, transformer, schema, repository, and inventory service only where required by the new field.
- Do not change pricing formulas or SKU pricing state transitions.
- Do not add new dependencies.
- Do not run Git commands under the repository's `AGENTS.md` policy.

## Review Checklist

- [x] Approved readable format is `NH-B925-BM-1P5C-N12`.
- [x] Category, material, pattern, weight, and optional size all contribute to the code.
- [x] Users can override a suggestion and explicitly restore automatic generation.
- [x] Each `Cách tính giá SKU` card displays its current SKU code.
- [x] Codes are unique across the whole warehouse and use `-02`, `-03` suffixes.
- [x] The API, not the browser, is the final uniqueness authority.
- [x] Existing product-level code and legacy embedded SKU data remain compatible.
- [x] Search, detail display, validation, and tests are included.
- [x] Pricing and unrelated inventory behavior stay out of scope.
