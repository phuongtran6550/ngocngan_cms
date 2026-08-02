# Literal YTPlus DNA Port Implementation Plan

**Goal:** Make CMS_2 consume YTPlus-style session/menu data while preserving every existing Ngoc Chau API path and payload.

**Architecture:** Add one compatibility seam for session, request-result and navigation data. Runtime menu data wins when supplied by the existing login or `/auth/me` response; the established route metadata remains the explicit fallback until the backend supplies a menu. Render that normalized tree recursively in the Phoenix sidebar.

**Constraints:** Modify only CMS_2. YTPlus remains read-only. Do not invent API endpoints. Per user instruction, do not run or add automated tests in this implementation pass.

**Implementation status:** All source migration tasks below are implemented.
Technical and visual validation remain pending until the user explicitly
authorizes them.

### Task 1: Normalize YTPlus-compatible session data

- [x] Extend auth contracts to accept an optional recursive menu and optional token expiry metadata from the existing authentication responses.
- [x] Keep the current `{ token, user }` response working without transformation.
- [x] Persist the normalized user/menu state through the existing auth store only.

### Task 2: Centralize navigation source selection

- [x] Add one navigation adapter that maps a runtime menu item's route name/path to CMS_2 routes.
- [x] Use the runtime tree as the permission/navigation source when present; use the current route-derived tree otherwise.
- [x] Preserve route-level permission guards as a defense-in-depth fallback.

### Task 3: Port recursive Phoenix navigation behavior

- [x] Replace the fixed two-level sidebar branch with a recursive Phoenix-compatible node component.
- [x] Expand active ancestors and collapse inactive branches on every route change.
- [x] Keep desktop and mobile rendering on the same normalized tree.

### Task 4: Establish request compatibility seam

- [x] Fold the existing resource request facade into a general YTPlus-shaped success result without changing current Axios error semantics.
- [x] Keep current Ngoc Chau service request verbs, payloads and response adapters unchanged.

### Task 5: Continue the literal CRUD migration in separate passes

- [x] Move the read-only Sources and Customers aggregate lists to an explicit `ReadonlyResourceDeclaration`, preserving their list endpoint, sorting, cross-page view action, and action permission.
- [x] Move Roles and Users list/create/update/delete state to the shared CRUD runtime while keeping their permission matrix and remote role-option drawers as scoped feature slots.
- [x] Confirm that Orders and Warehouse remain domain-specific workflows: each owns draft/media or multipart/detail behavior that does not map to a declarative resource contract.
