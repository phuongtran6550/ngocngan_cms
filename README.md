# CMS_2

Vue 3 frontend for Ngoc Chau Version 2 CMS. The codebase ports YTPlus
navigation/session DNA through a compatibility seam: literal route ownership,
a protected application root, optional backend-driven menu trees, recursive
navigation, and shared list/form/delete lifecycle. It keeps Ngoc Chau's
existing API paths, query parameters, verbs, payloads, and response contracts.

## Architecture

| Folder | Responsibility |
| --- | --- |
| `src/router/` | Literal client and administrator route arrays plus route/menu guards. |
| `src/App.vue` | Protected application shell, global layout, and cross-cutting UI composition. |
| `src/stores/` | Global application state, including compatible session/menu data and UI options. |
| `src/request/` | The sole Axios boundary: authorization, API envelope normalization, errors, cancellation, assets, and the resource request facade. |
| `src/components/resource/` | Typed CRUD and read-only resource contracts plus the generic controller. |
| `src/components/ListLayout/` | Public list-page composition, its table shell, and the standard CRUD form/delete flow. |
| `src/components/` | Reusable Phoenix layout, table, form, overlay, media, feedback, and UI primitives. |
| `src/views/` | Feature pages. Standard CRUD routes are thin declarations; workflows with distinct behavior remain custom. |

### Standard Resource Flow

```text
route -> thin feature view -> ListLayout -> resource controller
      -> typed resource transport -> shared request boundary -> Ngoc Chau API
```

`ResourceDeclaration` owns the full CRUD contract for a standard resource:
endpoint, query serialization, exact HTTP verbs, request body, response mapping,
labels, permissions, and domain-specific error messages.
`ReadonlyResourceDeclaration` owns the same list contract without a writable
API surface, so the shared page cannot expose create, edit, or delete controls
that the backend does not support. `ListLayout` owns common list, search,
filter, sort, field selection, pagination, cancellation, and stale-response
handling; it adds the drawer and delete confirmation only for a CRUD contract.

The catalog pilot lives in `src/views/Categories/config.ts`. Its Category,
Material, and Pattern declarations share the generic runtime while preserving
their separate `/categories`, `/materials`, and `/patterns` contracts.
`src/views/Sources/config.ts` and `src/views/Customers/config.ts` use the
read-only form of the same runtime for inventory/customer aggregates and retain
their permission-gated cross-page actions.
`src/views/Administrator/User/config.ts` and
`src/views/Administrator/Roles/config.ts` use the CRUD form; their feature
views provide only the specialized drawer slot for remote role options and the
permission matrix.

### Custom Workflows

Orders (media and drafts), warehouse (multipart upload and details), dashboard,
profile/password, Zalo, and error pages remain custom views. They use the
common request and application layers but are not forced into standard CRUD
when that would hide business rules.

### Fast Sales Workflow

The sales flow is optimized for a busy counter and uses the existing Product barcode scanner:

- `/orders/create` keeps one versioned browser-local Pinia cart, supports continuous barcode scanning, and increments one cart row when the same SKU is scanned again.
- Checkout is sequential: the seller finalizes the cart, captures the whole order in an embedded rear-camera frame, then optionally enters customer identity before the only persistence action runs.
- The inline photo step auto-advances after capture, supports torch/retry and a validated existing-image fallback, and stops the camera whenever that step is left or the page is hidden.
- The camera guide mirrors the physical board with fixed `Tên khách`, `Sản phẩm`, and `SĐT` zones. Sellers keep the board at least half of the frame, keep products out of identity bands, avoid glare, and do not write price calculations because the cart owns fixed prices.
- Photos below a 1280-pixel longest edge still proceed without another confirmation click, but the customer step keeps a visible warning that OCR may require manual entry.
- Only checkout order photos use the higher-detail 1600-pixel/JPEG-0.84 client profile. Existing resource uploads retain the shared 960-pixel/JPEG-0.72 defaults.
- Product detail exposes `Thêm vào giỏ hàng` for active in-stock SKUs without navigating away.
- Inventory price is read-only in the cart. Checkout sends only SKU identity and quantity; the API recalculates the authoritative price.
- The order photo is required. Customer name and phone are optional and visually secondary.
- Local stock warnings block submit immediately, while the API remains authoritative and never permits negative inventory.
- Retryable checkout failures preserve the cart, photo, customer fields, and idempotency key. Cart conflicts return to the cart and invalidate the old photo; successful checkout clears the working data and local cart.
- `/orders/missing` contains completed sales waiting for OCR review or manual customer entry.
- `/customers/:phone` shows derived KPIs, order history, SKU/product totals, and category totals for the normalized phone identity.

Customer information moves through `ocr_processing`, `review_required`, `manual_required`, and `complete`. OCR suggestions are always shown beside the original order photo and require a person to confirm or correct them. Review shows field-level confidence, Vietnamese guidance, and up to three one-click alternatives while preserving one final confirmation action. The incomplete-order page refreshes visible `ocr_processing` rows every eight seconds and stops polling when hidden, unmounted, or no processing rows remain. The CMS never receives Google credentials and never calls Vision or Gemini directly.

Primary order workflow routes:

- `http://localhost:5174/orders`
- `http://localhost:5174/orders/create`
- `http://localhost:5174/orders/missing`
- `http://localhost:5174/products`
- `http://localhost:5174/customers`

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the CMS dev server on port `5174`. |
| `npm run preview` | Preview the built CMS on port `4174`. |
| `npm run build` | Type-check and build the production bundle. |
| `npm run typecheck` | Run Vue/TypeScript type checking only. |
| `npm run lint` | Run ESLint over the frontend workspace. |

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL for API requests. Defaults to `http://localhost:4100/api`. |
| `VITE_ASSET_BASE_URL` | Base URL for public assets. Defaults to the API host root. |

## Operational Rules

- Use `src/request/index.ts` and `src/request/resource-client.ts` for API traffic; do not import Axios outside the request layer.
- Preserve the backend's configured verbs and payloads. Runtime menu data is accepted from the existing login or `/auth/me` response when supplied; route metadata remains the fallback until the backend provides it.
- A realtime adapter can dispatch `menu:updated` with the recursive menu payload or `menu:reload`; `App.vue` persists the former and refreshes the latter through the existing `/auth/me` API.
- Do not add YTPlus encryption, token refresh, socket, or dual-session endpoints without a backend contract.
- Phoenix assets remain vendored under `public/phoenix` and `src/styles/vendor`.
