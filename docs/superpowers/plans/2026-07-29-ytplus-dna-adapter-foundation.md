# YTPlus DNA Adapter Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This workspace forbids all Git commands; do not create commits.

**Goal:** Establish the typed YTPlus-style request and declarative CRUD runtime, then migrate the category/material/pattern family as the first verified CMS_2 resource family.

**Architecture:** Keep the Ngoc Chau backend protocol unchanged behind resource-specific transport adapters. Shared resource components own standard list, form, delete, pagination, stale-request protection, and permission-aware CRUD lifecycle; thin views only pass one resource declaration. The generic layer remains split into contracts, controller, and Vue presentation instead of transplanting YTPlus's monolithic components.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `src/request/resource-client.ts` | Wrap the shared Axios instance in a typed, YTPlus-shaped request result without changing the server contract. |
| `src/components/resource/contracts.ts` | Define resource declaration, list result, transport adapter, form mapper, and domain feedback contracts. |
| `src/components/resource/useResourceController.ts` | Own standard list/form/delete state, cancellation, stale-response protection, and CRUD lifecycle. |
| `src/components/resource/ResourcePage.vue` | Compose existing `ListLayout`, `FormLayout`, drawer, and confirm dialog around one declaration/controller. |
| `src/views/Categories/config.ts` | Be the single owner of category, material, and pattern metadata plus backend transport adapters. |
| `src/views/Categories/index.vue` | Thin category declaration consumer. |
| `src/views/Materials/index.vue` | Thin material declaration consumer. |
| `src/views/Patterns/index.vue` | Thin pattern declaration consumer. |
| `src/views/Categories/types.ts` | Retain domain model types and move the standalone summary type out of the old service. |
| `src/views/Categories/components/CategorySummary.vue` | Import its type from the domain types file instead of a deleted service file. |
| `src/views/Categories/service.ts` | Remove after the declaration transport replaces every caller. |
| `src/views/Categories/store.ts` | Remove after the generic controller replaces every caller. |
| `src/views/Categories/components/CatalogListPage.vue` | Remove after all three routes use `ResourcePage`. |
| `src/views/Categories/components/CategoryFormDrawer.vue` | Remove after `ResourcePage` owns the standard drawer/form. |
| `README.md` | Document the actual folder layout and resource declaration architecture. |

## Task 1: Add A Typed YTPlus-Shaped Resource Request Result

**Files:**
- Create: `src/request/resource-client.ts`

- [ ] **Step 3: Implement the minimal resource request facade**

```ts
import type { AxiosRequestConfig, RawAxiosResponseHeaders } from "axios";
import { apiError, request } from "@/request";

export interface ResourceRequestSuccess<T> {
  status: "success";
  statusCode: number;
  response: T;
  headers: RawAxiosResponseHeaders;
}

export async function resourceRequest<T>(
  config: AxiosRequestConfig,
): Promise<ResourceRequestSuccess<T>> {
  try {
    const result = await request.request<T>(config);
    return {
      status: "success",
      statusCode: result.status,
      response: result.data,
      headers: result.headers,
    };
  } catch (error) {
    throw apiError(error);
  }
}
```

## Task 2: Define One Typed Resource Declaration Contract

**Files:**
- Create: `src/components/resource/contracts.ts`

- [ ] **Step 3: Implement the declaration contracts**

```ts
import type { ResourceDefinition, ResourceRow } from "@/config/resource";

export interface ResourceListResult<Row extends ResourceRow> {
  items: Row[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResourceListInput<Filters extends Record<string, unknown>> {
  page: number;
  limit: number;
  query: string;
  filters: Filters;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export interface ResourceTransport<Row extends ResourceRow, FormModel, Filters extends Record<string, unknown>> {
  list(input: ResourceListInput<Filters>, signal?: AbortSignal): Promise<ResourceListResult<Row>>;
  detail?(id: string, signal?: AbortSignal): Promise<Row>;
  create(input: FormModel): Promise<Row>;
  update(id: string, input: FormModel): Promise<Row>;
  remove(id: string): Promise<void>;
}

export interface ResourceDeclaration<Row extends ResourceRow, FormModel extends Record<string, unknown>, Filters extends Record<string, unknown>> {
  key: string;
  definition: ResourceDefinition;
  initialFilters: Filters;
  selectedColumns: string[];
  initialSort: { by: string; direction: "asc" | "desc" };
  emptyForm(): FormModel;
  formFromRow(row: Row): FormModel;
  transport: ResourceTransport<Row, FormModel, Filters>;
  labels: { singular: string; create: string; update: string; delete: string };
  canDelete?(row: Row): string | undefined;
  errorMessage?(error: unknown, row?: Row): string | undefined;
}
```

## Task 4: Compose The Generic YTPlus-Style Resource Page

**Files:**
- Create: `src/components/resource/ResourcePage.vue`

- [ ] **Step 3: Implement the generic page composition**

```vue
<ListLayout
  :definition="effectiveDefinition"
  :rows="controller.items.value"
  :pagination="controller.pagination.value"
  :loading="controller.loading.value"
  :error="controller.error.value"
  :search="controller.query.value"
  :selected-columns="controller.selectedColumns.value"
  :can-delete-row="canDeleteRow"
  @create="controller.openCreate"
  @search="controller.applySearch"
  @refresh="controller.load"
  @fields="controller.setSelectedColumns"
  @sort="controller.applySort"
  @edit="controller.openEdit"
  @delete="controller.requestDelete"
  @page="controller.load"
/>
```

Render declared select filters in the `filters` slot, `DrawerPanel` plus the
existing `FormLayout` for create/edit, and `ConfirmDialog` for deletion. Derive
toolbar actions from `authenStore().can(...)`; do not duplicate resource action
checks in route views.

## Task 5: Migrate Categories, Materials, And Patterns To One Declaration Source

**Files:**
- Modify: `src/views/Categories/config.ts`
- Modify: `src/views/Categories/types.ts`
- Modify: `src/views/Categories/index.vue`
- Modify: `src/views/Materials/index.vue`
- Modify: `src/views/Patterns/index.vue`
- Modify: `src/views/Categories/components/CategorySummary.vue`
- Delete: `src/views/Categories/service.ts`
- Delete: `src/views/Categories/store.ts`
- Delete: `src/views/Categories/components/CatalogListPage.vue`
- Delete: `src/views/Categories/components/CategoryFormDrawer.vue`

- [ ] **Step 3: Move category transport and business feedback into `config.ts`**

```ts
export const categoryResource: ResourceDeclaration<ProductCategory, CategoryFormModel, { status: CategoryStatus | "" }> = {
  key: "categories",
  definition: catalogDefinition(catalogResources.category),
  initialFilters: { status: "" },
  selectedColumns: ["name", "usageCount", "status", "updatedAt"],
  initialSort: { by: "sortOrder", direction: "asc" },
  emptyForm: () => ({ name: "", status: "active", sortOrder: 0 }),
  formFromRow: (row) => ({ name: row.name, status: row.status, sortOrder: row.sortOrder }),
  labels: {
    singular: "danh mục",
    create: "Đã thêm danh mục",
    update: "Đã cập nhật danh mục",
    delete: "Đã xóa danh mục",
  },
  transport: createCatalogTransport(catalogResources.category),
  canDelete: (row) => Number(row.usageCount || 0) > 0
    ? inUseMessage(catalogResources.category, Number(row.usageCount))
    : undefined,
  errorMessage: (error, row) => categoryErrorMessage(catalogResources.category, error, row),
};
```

Implement `materialResource` and `patternResource` through the same
`createCatalogResource` factory. Its transport must call `resourceRequest`
with `GET`, `POST`, `PATCH`, and `DELETE`, preserve the existing query keys,
and map `{ item }` responses exactly once. Move `CategorySummaryData` to
`types.ts` before removing `service.ts`.

- [ ] **Step 4: Replace the three route views with thin declarations**

```vue
<template><ResourcePage :resource="resource" /></template>

<script lang="ts">
import { defineComponent } from "vue";
import ResourcePage from "@/components/resource/ResourcePage.vue";
import { categoryResource } from "@/views/Categories/config";

export default defineComponent({
  name: "CategoryListPage",
  components: { ResourcePage },
  data: () => ({ resource: categoryResource }),
});
</script>
```

Use `materialResource` and `patternResource` in the corresponding two route
views. Then remove the legacy category service, store, generic wrapper, and
category-only drawer only after no import remains.

- [ ] **Step 6: Run the category migration suite**

Expected: category, material, pattern, controller, and page tests pass with no
imports from deleted category service/store/wrapper files.

## Task 7: Run The Foundation Quality Gate

**Files:**
- Modify only files exposed by failed verification in Tasks 1-6.

- [ ] **Step 1: Run static checks**

Run: `npm run typecheck && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 2: Run the complete unit suite**

- [ ] **Step 3: Run focused browser coverage for catalog routes**

Expected: categories, materials, and patterns render against the browser mock
API at every configured project without console errors or failed assertions.

- [ ] **Step 4: Review requirement coverage before marking the foundation complete**

Verify explicitly:

- category/material/pattern views contain only declaration-to-runtime wiring;
- their endpoint, HTTP verbs, query keys, body fields, response mapping, and
  domain error messages match the old behavior;
- no category feature store/service remains;
- shared controller preserves cancellation and stale-response protection;
- README and DNA test no longer describe non-existent architecture.

## Follow-On Plans

After the foundation passes its quality gate, write separate plans before
migrating each independent family: read-only sources/customers, roles/users,
warehouse, and orders. Dashboard, profile, password, Zalo, and error pages
remain custom consumers of the common request and app layers.
