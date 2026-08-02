# Warehouse SKU Availability Design

## Problem

The create form currently generates SKU codes only from local form data. The API checks the database during persistence and may append a suffix when the displayed code already exists. This makes the code shown before saving differ from the code shown after saving without explaining why.

## Approved Behavior

- The CMS checks all non-empty SKU codes through one authenticated API request before presenting them as usable.
- Automatically generated codes may be replaced with the first available code returned by the API. The form explains which requested code already existed and which code was selected.
- Manually entered codes are never silently replaced. If a manual code exists, the form reports the conflict, suggests the first available code, and blocks submission.
- Submission performs an immediate fresh check so clicking save during the debounce window cannot bypass validation.
- The database unique index and create retry remain authoritative for concurrent requests.
- If a manual code becomes duplicated between the availability check and persistence, the API returns a conflict instead of silently renaming it.

## API Contract

`POST /api/warehoused-goods/sku-codes/check`

Request:

```json
{
  "skus": [
    { "code": "NH-B925-BM-1P5C-N12", "codeMode": "auto" },
    { "code": "CUSTOM-N14", "codeMode": "manual" }
  ]
}
```

Response:

```json
{
  "items": [
    {
      "requestedCode": "NH-B925-BM-1P5C-N12",
      "code": "NH-B925-BM-1P5C-N12-03",
      "codeMode": "auto",
      "available": false
    },
    {
      "requestedCode": "CUSTOM-N14",
      "code": "CUSTOM-N14",
      "codeMode": "manual",
      "available": true
    }
  ]
}
```

The response preserves request order. `available` means the exact normalized requested code is available; `code` is the deterministic first available code calculated by the same backend allocation helper used during persistence.

## Frontend State

Each form SKU retains a local `codeSource`, which is the generated candidate derived from category, material, pattern, weight, and size. A database-adjusted code is preserved while `codeSource` is unchanged, so editing money fields does not reset the code and cause UI flicker. Changing a source field creates a new candidate and schedules another check.

The field exposes four useful states: checking, available, adjusted automatic code, and conflicting manual code. Network failures block submission with a clear message because silently saving in that state could recreate the original mismatch.

## Concurrency

Availability checks are advisory because another request can claim a code immediately afterward. Persistence therefore keeps the unique index and retry behavior for automatic codes. Manual codes are rejected on a late conflict so user-entered identifiers are never changed without consent.

## Testing

- API helper/service tests cover deterministic batch allocation and manual conflicts.
- Validator and route tests cover authentication, request shape, limits, and code modes.
- CMS service tests cover the request contract.
- Form tests cover automatic adjustment, manual conflict, immediate submit checking, stale responses, and stable generated codes.
- Warehouse browser tests cover the visible explanation and the final persisted code.
