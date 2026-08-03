# YTPlus DNA Adapter Design

## Status

Approved. The source migration now covers catalog CRUD, the read-only Sources
and Customers aggregates, and the Roles/Users CRUD lists with feature-specific
drawer slots. Technical and visual verification remain deferred until the user
explicitly authorizes them.

## Objective

Restructure CMS_2 so its page composition, generic CRUD ownership, request
facade, and administrator flow follow the architectural DNA of the reference
frontend at `/Users/phuongtran/Documents/YTPlus/cms` while preserving Ngoc
Chau's existing backend API contract and business behavior.

The target is structural and behavioral DNA compatibility, not a literal file
copy. The reference's known type errors, large route-specific branches, and
backend assumptions must not be imported into CMS_2.

## Reference Findings

### YTPlus DNA To Adopt

- Route files are literal arrays split into client and administrator areas.
- `App.vue` owns the protected application composition and cross-cutting route
  behavior.
- Views are thin declarations. Standard resource pages provide endpoint,
  columns, actions, filters, and form fields to shared CRUD primitives.
- Shared list, table, and form primitives own the normal list, detail, create,
  edit, delete, pagination, field-selection, and form lifecycle.
- A single request facade owns API URL construction, headers, authorization,
  response handling, and cross-cutting failures.
- Global Pinia stores are reserved for application state such as authentication
  and layout rather than duplicating standard CRUD state per feature.

### Reference Behavior Not Safe To Copy Literally

- The reference's table serializes filters as JSON and its form only sends
  `POST` or `PUT`; the Ngoc Chau API uses typed query parameters and also
  requires `PATCH`.
- The reference expects a `{ status, status_code, response }` client wrapper,
  whereas CMS_2 feature APIs return normalized typed bodies.
- AES payload encryption, refresh-token endpoints, Socket.IO menu reloads,
  separate admin/user sessions, and dynamic menus require server support not
  present in the CMS_2 API contract.
- Reference generic components contain route-specific branches and are too
  large to transplant without recreating the same coupling and type debt.

## Scope

### In Scope

- `src/request`, `src/router`, `src/App.vue`, global stores, shared CRUD
  components, feature declarations, feature views, tests, and documentation in
  CMS_2.
- Moving endpoint, HTTP verb, query serialization, body serialization, and
  response normalization to one typed resource declaration.
- Replacing duplicated feature CRUD stores/services with one generic resource
  runtime where the behavior is standard.
- Preserving Ngoc Chau pages that need a custom workflow, such as order media
  capture, warehouse upload, dashboard export, Zalo OAuth callback, and detail
  pages.
- Replacing the self-referential YTPlus DNA test with tests of the actual
  declared DNA contract and migration invariants.

### Out Of Scope

- Editing any backend/API project, database schema, deployment configuration,
  or external service.
- Changing Ngoc Chau endpoint paths, response shapes, permissions, or business
  rules unless a current frontend defect requires an explicitly documented
  client-side adapter.
- Enabling encryption, token refresh, sockets, dynamic menus, or a separate
  administrator login without an existing compatible server contract.
- Copying the YTPlus visual theme, third-party plugins, analytics, i18n
  catalogues, or known type errors.

## Pre-Coding Thinking

**Task:** Replace CMS_2's feature-by-feature CRUD stack with a YTPlus-style
declarative CRUD architecture without changing the Ngoc Chau backend.

**Complexity:** Complex architecture refactor.

**Role perspective:** Solution Architect and Staff Engineer.

**Dimensions activated:** Frontend, backend/API, DevOps, security, senior
engineering, tech lead, solution architecture, meta-reasoning, core reasoning,
and SDLC.

### Key Insights

- The original mismatch is not a naming mismatch. CMS_2 currently owns CRUD in
  feature Pinia stores and services, while YTPlus owns it in shared list/table/
  form primitives.
- A literal transplant would fail against the existing backend because it would
  replace `PATCH`, multipart requests, and typed query parameters with the
  reference's assumptions.
- A contract adapter lets the presentation and ownership model match YTPlus
  while keeping the server-facing contract unchanged.
- CMS_2 currently has stronger type and test health than the reference. The
  migration must preserve that health as a hard gate.

### Trade-offs

| Option | Benefit | Cost | Decision |
| --- | --- | --- | --- |
| Literal YTPlus transplant | Highest source code similarity | Breaks existing API behavior and imports source debt | Reject |
| Keep current service/store architecture | Lowest migration risk | Does not meet the requested DNA | Reject |

### Assumptions

- CMS_2 is the only codebase that may be edited.
- The existing Ngoc Chau API contract is authoritative and must remain usable.
- Administrator access is represented by the existing authenticated user role
  and permissions; separate server-side admin sessions do not currently exist.
- The reference project is a frontend reference, not an API-server reference.

### Principal Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Generic runtime loses a feature-specific business rule | Incorrect order, warehouse, role, or category workflow | Migrate only standard CRUD first; keep custom page adapters and add behavior tests before each migration |
| Large shared component becomes another god object | Future coupling and type failure | Split runtime into request adapter, state machine, table presenter, form presenter, and resource declaration contracts |
| Refactor regresses authorization | Unauthorized route or action visibility | Keep permissions in resource declarations and verify route, toolbar, row action, and API-error behavior |
| Stale responses overwrite current state | Incorrect list content after rapid filter changes | Retain cancellation and monotonic request IDs inside the generic runtime |

## Target Architecture

```text
Route declaration
  -> thin feature view
  -> ResourcePage runtime
      -> ResourceListController
      -> ResourceTable and ResourceForm
      -> YTPlus-shaped request facade
      -> Ngoc Chau contract adapter
      -> existing Ngoc Chau API
```

### 1. Request Facade And Contract Adapter

`src/request` becomes the sole request boundary and exposes a YTPlus-shaped,
typed result to shared CRUD code:

- Success is represented consistently as `status`, `statusCode`, `response`,
  and headers.
- Failure is represented consistently as a normalized error with status, code,
  message, field errors, and details.
- The facade owns authorization headers, a 401 logout callback, optional 403
  notification dispatch, asset URL construction, and cancellation.
- It does not enable encryption or refresh behavior by default. Those features
  may only be added behind an explicit environment capability after a backend
  contract exists.

Each resource declaration supplies a contract adapter rather than leaking
backend-specific conditionals into shared UI:

- `list`: endpoint, query serializer, response mapper, optional abort signal.
- `detail`: endpoint builder and response mapper.
- `create`, `update`, and `remove`: endpoint builder, exact HTTP verb, body
  serializer, and response mapper.
- `options`: optional dependent option loaders and response mappers.

This keeps one source of truth for endpoint and transport behavior. It removes
the current duplication between `config.ts` endpoint metadata and `service.ts`
string literals.

### 2. Resource Declaration And Generic Runtime

Every standard list resource is declared once under its view domain. Its
declaration contains:

- Identity, page title, description, permission requirements, columns,
  filters, action availability, and form schema.
- A transport contract adapter as defined above.
- Sortable fields, pagination defaults, selected-column defaults, display
  transformations, and optional per-row action predicates.
- Business guard hooks for errors such as `CATEGORY_IN_USE`, `ROLE_IN_USE`,
  `SYSTEM_ROLE_IMMUTABLE`, and self-delete prevention.

`ResourcePage` replaces feature-by-feature standard CRUD stores. It owns:

- List state, pagination, filters, sorting, field selection, drawer/dialog
  state, create/edit form state, success/error notices, and reload behavior.
- `AbortController` cancellation and monotonic request IDs so stale responses
  cannot overwrite current data.
- The conventional YTPlus lifecycle: load list, fetch edit detail when the
  resource requires it, submit, close, and reload the current page.

The runtime is composed of focused files, not one monolithic component:

- resource contract and response mapper types;
- request/controller state machine;
- list/table presentation;
- form presentation and option loading;
- reusable confirm/error/feedback adapters.

### 3. Feature Migration Boundaries

Migrate resources in dependency order:

1. Categories, materials, and patterns share one resource family and validate
   the declaration/runtime model without media or special navigation.
2. Sources and customers validate read-only lists, cross-page links, and
   alternate endpoints.
3. Roles and users validate permission-gated actions, remote options, and
   domain error adapters.
4. Warehouse validates multipart create/update and detail navigation.
5. Orders validate custom media capture and draft workflow around the generic
   list rather than forcing it into generic CRUD.
6. Dashboard, profile, password, Zalo, and 403 remain custom pages that consume
   the common request facade and route/auth conventions only.

The old feature service/store files are removed only after the replacement
allowed before the corresponding migration gate passes.

### 4. Routes, Auth, Permissions, And App Composition

- Retain literal `client.ts` and `administrator.ts` route arrays, matching the
  source's route ownership style.
- Move shared protected-app composition behavior to `App.vue` only where it can
  be supported by the existing API: loading/progress feedback, title updates,
  protected shell state, and global API permission feedback.
- Preserve the existing `/auth/login` and `/auth/me` behavior and the current
  role/permission model. Do not manufacture YTPlus administrator login or
  refresh endpoints.
- The administrator route namespace may be migrated to `/administrator/...`
  all bookmarks. This is a frontend route change, not a backend endpoint
  change.
- Keep static client-side navigation derived from route metadata until the API
  supplies a trusted menu payload and live-update contract.

### 5. Documentation And DNA Verification

- Rewrite README to describe the actual `src/router`, `src/views`, `src/request`,
  `src/components`, and `src/stores` layout.
- Remove claims about non-existent `src/app`, `src/modules`, module registries,
  and obsolete tests.
- Replace the current self-referential DNA test with assertions for the declared
  architecture: literal route arrays, thin standard views, runtime ownership,
  no duplicate endpoint declarations, and no direct Axios use outside
  `src/request`.
- Reference-source comparisons must receive the YTPlus root explicitly through
  a test environment variable. Tests must never pretend to read the reference
  when they only inspect CMS_2.

## Data Flow Details

### Standard List

1. Route mounts a thin feature view with a resource declaration.
2. The generic controller derives initial state from the declaration and route
   query.
3. The controller serializes list state through the resource adapter and sends
   it through the request facade.
4. The adapter maps the existing API body to the generic page result.
5. The table renders mapped rows and only emits UI intents.
6. Controller state is updated only if the request remains current.

### Create Or Update

1. The resource form renders declaration fields and loads declared option data.
2. The form validates client-side requirements and returns a typed value model.
3. The controller selects `create` or `update` based on editing state.
4. The adapter applies the resource's true verb and body serializer, including
   multipart data where needed.
5. The controller maps domain error codes to resource-specific feedback,
   otherwise displays the normalized API error.
6. On success it closes the panel and reloads the appropriate current page.

### Delete

1. Row predicates and domain guard hooks decide whether delete is offered.
2. A common confirmation dialog asks for explicit confirmation.
3. The adapter performs the declared delete operation.
4. If the last row on a non-first page is deleted, the controller loads the
   previous page; otherwise it reloads the current page.

## Acceptance Criteria

- Standard CMS resource views are thin declarations following the YTPlus
  composition pattern.
- Generic CRUD ownership replaces duplicated standard list/form/delete stores
  and services.
- Every backend-facing operation retains its existing endpoint, HTTP method,
  query/body encoding, response mapping, and permission behavior.
- Feature-specific flows remain explicit outside generic CRUD rather than
  becoming route-name branches in shared components.
- Endpoint transport configuration has exactly one owner per resource.
- Documentation and DNA tests describe the actual architecture and do not make
  self-referential claims about the reference project.
- CMS_2 remains type-clean, lint-clean, and test-green throughout the staged
  migration.

## Deferred Capabilities

The following are intentionally deferred until the API server exposes a tested
contract: AES request encryption, access-token refresh, separate administrator
and user sessions, dynamic API-driven menus, Socket.IO menu updates, and
reference-specific analytics/i18n behavior.

## Git Constraint

This workspace is governed by a strict no-Git-command rule. The design document
is intentionally not committed by this agent.
