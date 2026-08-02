# YTPlus DNA Adapter Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This workspace forbids all Git commands; do not create commits.

**Goal:** Establish the typed YTPlus-style request and declarative CRUD runtime, then migrate the category/material/pattern family as the first verified CMS_2 resource family.

**Architecture:** Keep the Ngoc Chau backend protocol unchanged behind resource-specific transport adapters. Shared resource components own standard list, form, delete, pagination, stale-request protection, and permission-aware CRUD lifecycle; thin views only pass one resource declaration. The generic layer remains split into contracts, controller, and Vue presentation instead of transplanting YTPlus's monolithic components.

**Tech Stack:** Vue 3, TypeScript, Pinia for global state only, Axios, Vue Test Utils, Vitest, Playwright.

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
| `tests/unit/request/resource-client.test.ts` | Verify request-result wrapping and normalized failures. |
| `tests/unit/components/resource/useResourceController.test.ts` | Verify list parameters, stale responses, CRUD verbs, pagination fallback, and domain errors. |
| `tests/unit/components/resource/ResourcePage.test.ts` | Verify permission-aware generic list/form/delete composition. |
| `tests/unit/views/Categories/category.definition.test.ts` | Verify one declaration owns view and transport metadata. |
| `tests/unit/views/Categories/pages/CategoryListPage.test.ts` | Verify the category route is a thin generic runtime consumer. |
| `tests/architecture/ytplus-cms-dna.test.ts` | Replace the self-referential assertion with architecture invariants that describe CMS_2 truthfully. |
| `README.md` | Document the actual folder layout and resource declaration architecture. |

## Task 1: Add A Typed YTPlus-Shaped Resource Request Result

**Files:**
- Create: `src/request/resource-client.ts`
- Create: `tests/unit/request/resource-client.test.ts`

- [ ] **Step 1: Write the failing request result tests**

```ts
import { vi } from "vitest";
import { request } from "@/request";
import { resourceRequest } from "@/request/resource-client";

describe("resourceRequest", () => {
  afterEach(() => vi.restoreAllMocks());

  it("wraps an already-normalized response in the YTPlus resource shape", async () => {
    vi.spyOn(request, "request").mockResolvedValue({
      status: 200,
      data: { items: [{ id: "category-1" }] },
      headers: { etag: "catalog-v1" },
    } as never);

    await expect(resourceRequest<{ items: Array<{ id: string }> }>({
      method: "get",
      url: "/categories",
    })).resolves.toEqual({
      status: "success",
      statusCode: 200,
      response: { items: [{ id: "category-1" }] },
      headers: { etag: "catalog-v1" },
    });
  });

  it("rethrows the shared normalized error without hiding its domain code", async () => {
    vi.spyOn(request, "request").mockRejectedValue({
      message: "Danh mục đang được sử dụng",
      code: "CATEGORY_IN_USE",
      status: 409,
    });

    await expect(resourceRequest({ method: "delete", url: "/categories/category-1" }))
      .rejects.toMatchObject({ code: "CATEGORY_IN_USE", status: 409 });
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails because the module is absent**

Run: `npm run test:unit -- tests/unit/request/resource-client.test.ts`

Expected: FAIL with an unresolved `@/request/resource-client` import.

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

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm run test:unit -- tests/unit/request/resource-client.test.ts`

Expected: 2 passing tests.

## Task 2: Define One Typed Resource Declaration Contract

**Files:**
- Create: `src/components/resource/contracts.ts`
- Create: `tests/unit/components/resource/contracts.test.ts`

- [ ] **Step 1: Write the failing declaration contract test**

```ts
import type { ResourceDeclaration } from "@/components/resource/contracts";

it("keeps the endpoint and update verb on one transport declaration", () => {
  const resource: ResourceDeclaration<{ id: string }, { name: string }, { status: string }> = {
    key: "categories",
    definition: {
      key: "categories",
      title: "Danh mục",
      endpoint: "/categories",
      permission: {},
      columns: [],
      actions: {},
    },
    initialFilters: { status: "" },
    selectedColumns: ["name"],
    emptyForm: () => ({ name: "" }),
    formFromRow: (row) => ({ name: row.id }),
    transport: {
      list: async () => ({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 }),
      create: async () => ({ id: "new" }),
      update: async () => ({ id: "updated" }),
      remove: async () => undefined,
    },
  };

  expect(resource.definition.endpoint).toBe("/categories");
  await expect(resource.transport.update("category-1", { name: "Nhẫn" }))
    .resolves.toEqual({ id: "updated" });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/resource/contracts.test.ts`

Expected: FAIL with an unresolved contracts module.

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

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm run test:unit -- tests/unit/components/resource/contracts.test.ts`

Expected: 1 passing test.

## Task 3: Implement And Test The Shared Resource Controller

**Files:**
- Create: `src/components/resource/useResourceController.ts`
- Create: `tests/unit/components/resource/useResourceController.test.ts`

- [ ] **Step 1: Write failing controller tests for the lifecycle that used to be duplicated in feature stores**

```ts
import { vi } from "vitest";
import { useResourceController } from "@/components/resource/useResourceController";
import type { ResourceDeclaration } from "@/components/resource/contracts";

const resource = (): ResourceDeclaration<{ id: string; name: string }, { name: string }, { status: string }> => ({
  key: "categories",
  definition: { key: "categories", title: "Danh mục", endpoint: "/categories", permission: {}, columns: [], actions: {} },
  initialFilters: { status: "" },
  selectedColumns: ["name"],
  initialSort: { by: "updatedAt", direction: "desc" },
  emptyForm: () => ({ name: "" }),
  formFromRow: (row) => ({ name: row.name }),
  labels: { singular: "danh mục", create: "Đã thêm danh mục", update: "Đã cập nhật danh mục", delete: "Đã xóa danh mục" },
  transport: {
    list: vi.fn().mockResolvedValue({ items: [{ id: "new", name: "Mới" }], page: 2, limit: 20, total: 1, totalPages: 2 }),
    create: vi.fn().mockResolvedValue({ id: "created", name: "Tạo" }),
    update: vi.fn().mockResolvedValue({ id: "updated", name: "Sửa" }),
    remove: vi.fn().mockResolvedValue(undefined),
  },
});

it("serializes filters, rejects stale responses, and preserves the newest page", async () => {
  const controller = useResourceController(resource());
  await controller.setFilter("status", "active");
  await controller.load(2);

  expect(controller.items.value).toEqual([{ id: "new", name: "Mới" }]);
  expect(controller.pagination.value.page).toBe(2);
  expect(controller.filters.value).toEqual({ status: "active" });
});

it("uses the declaration transport and reloads the current page after update", async () => {
  const controller = useResourceController(resource());
  controller.pagination.value = { page: 3, limit: 20, total: 1, totalPages: 3 };
  controller.openEdit({ id: "category-1", name: "Nhẫn" });
  await controller.save({ name: "Nhẫn cưới" });

  expect(controller.message.value).toBe("Đã cập nhật danh mục");
  expect(controller.drawerOpen.value).toBe(false);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/resource/useResourceController.test.ts`

Expected: FAIL with an unresolved controller module.

- [ ] **Step 3: Implement the controller with cancellation and current-request checks**

```ts
const listController = ref<AbortController | null>(null);
const listRequestId = ref(0);

async function load(page = pagination.value.page): Promise<void> {
  listController.value?.abort();
  listController.value = new AbortController();
  const requestId = ++listRequestId.value;
  loading.value = true;
  error.value = "";
  try {
    const result = await declaration.transport.list({
      page,
      limit: pagination.value.limit,
      query: query.value,
      filters: filters.value,
      sortBy: sortBy.value,
      sortDirection: sortDirection.value,
    }, listController.value.signal);
    if (requestId !== listRequestId.value) return;
    items.value = result.items;
    pagination.value = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    };
  } catch (caught) {
    if (requestId !== listRequestId.value) return;
    const normalized = apiError(caught);
    if (normalized.code !== "ERR_CANCELED") error.value = normalized.message;
  } finally {
    if (requestId === listRequestId.value) loading.value = false;
  }
}
```

Also implement `applySearch`, `setFilter`, `applySort`, `openCreate`,
`openEdit`, `closeDrawer`, `save`, `requestDelete`, `cancelDelete`, and
`confirmDelete`. Each function must use declaration hooks rather than testing
resource keys or route names.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `npm run test:unit -- tests/unit/components/resource/useResourceController.test.ts`

Expected: all controller lifecycle tests pass.

## Task 4: Compose The Generic YTPlus-Style Resource Page

**Files:**
- Create: `src/components/resource/ResourcePage.vue`
- Create: `tests/unit/components/resource/ResourcePage.test.ts`

- [ ] **Step 1: Write the failing generic page test**

```ts
import { flushPromises, mount } from "@vue/test-utils";
import ResourcePage from "@/components/resource/ResourcePage.vue";
import { categoryResource } from "@/views/Categories/config";

it("renders one declaration through the existing list, form drawer, and delete dialog", async () => {
  const wrapper = mount(ResourcePage, {
    props: { resource: categoryResource },
    global: { mocks: { $route: { query: {} } }, stubs: { Teleport: true } },
  });
  await flushPromises();

  expect(wrapper.text()).toContain("Quản lý danh mục");
  await wrapper.get('[data-testid="list-create"]').trigger("click");
  expect(wrapper.find("form").exists()).toBe(true);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm run test:unit -- tests/unit/components/resource/ResourcePage.test.ts`

Expected: FAIL with an unresolved `ResourcePage` component.

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

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm run test:unit -- tests/unit/components/resource/ResourcePage.test.ts`

Expected: generic page test passes with no category-specific component imports.

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
- Modify: `tests/unit/views/Categories/category.definition.test.ts`
- Replace: `tests/unit/views/Categories/category.service.test.ts`
- Replace: `tests/unit/views/Categories/category.store.test.ts`
- Modify: `tests/unit/views/Categories/pages/CategoryListPage.test.ts`

- [ ] **Step 1: Write failing declaration transport tests before deleting legacy files**

```ts
import { vi } from "vitest";
import { request } from "@/request";
import { categoryResource } from "@/views/Categories/config";

it("owns the category list endpoint and PATCH update behavior in one declaration", async () => {
  const get = vi.spyOn(request, "request").mockResolvedValue({
    status: 200,
    data: { items: [], page: 1, limit: 20, total: 0, totalPages: 0 },
    headers: {},
  } as never);
  const patch = vi.spyOn(request, "request").mockResolvedValue({
    status: 200,
    data: { item: { id: "category-1" } },
    headers: {},
  } as never);

  await categoryResource.transport.list({
    page: 1, limit: 20, query: "vàng", filters: { status: "active" },
    sortBy: "updatedAt", sortDirection: "desc",
  });
  await categoryResource.transport.update("category-1", {
    name: "Nhẫn cưới", status: "active", sortOrder: 3,
  });

  expect(get).toHaveBeenCalledWith(expect.objectContaining({
    method: "get", url: "/categories", params: expect.objectContaining({ status: "active" }),
  }));
  expect(patch).toHaveBeenCalledWith(expect.objectContaining({
    method: "patch", url: "/categories/category-1",
  }));
});
```

- [ ] **Step 2: Run the category declaration and page tests to verify the old architecture cannot satisfy the new contract**

Run: `npm run test:unit -- tests/unit/views/Categories/category.definition.test.ts tests/unit/views/Categories/pages/CategoryListPage.test.ts`

Expected: FAIL because `categoryResource` and its transport do not yet exist.

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

- [ ] **Step 5: Update focused tests to exercise the declaration and shared controller**

Replace legacy service/store import assertions with:

```ts
expect(categoryResource.definition.endpoint).toBe("/categories");
expect(categoryResource.initialSort).toEqual({ by: "sortOrder", direction: "asc" });
expect(categoryResource.canDelete?.({
  id: "category-1", name: "Nhẫn", type: "category", status: "active", sortOrder: 0, usageCount: 4,
})).toContain("4 sản phẩm");
```

Keep page assertions for title, row actions, create drawer, and trimmed route
query, but spy on `categoryResource.transport.list` instead of a deleted
service.

- [ ] **Step 6: Run the category migration suite**

Run: `npm run test:unit -- tests/unit/views/Categories tests/unit/components/resource`

Expected: category, material, pattern, controller, and page tests pass with no
imports from deleted category service/store/wrapper files.

## Task 6: Make Documentation And DNA Tests Describe The Real Architecture

**Files:**
- Modify: `tests/architecture/ytplus-cms-dna.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Write failing architecture assertions that reject the previous self-reference and duplicated category endpoint ownership**

```ts
const referenceRoot = process.env.YTPLUS_CMS_REFERENCE_ROOT;

it("uses the generic resource runtime for standard catalog routes", () => {
  const categoryPage = readFileSync(resolve(sourceRoot, "views/Categories/index.vue"), "utf8");
  expect(categoryPage).toContain("@/components/resource/ResourcePage.vue");
  expect(existsSync(resolve(sourceRoot, "views/Categories/store.ts"))).toBe(false);
  expect(existsSync(resolve(sourceRoot, "views/Categories/service.ts"))).toBe(false);
});

it.runIf(Boolean(referenceRoot))("compares stable DNA invariants only when the reference root is explicit", () => {
  expect(existsSync(referenceRoot!)).toBe(true);
  expect(referenceRoot).not.toBe(cmsRoot);
});
```

- [ ] **Step 2: Run the architecture test to verify it fails before documentation and architecture changes are complete**

Run: `YTPLUS_CMS_REFERENCE_ROOT=/Users/phuongtran/Documents/YTPlus/cms npm run test:unit -- tests/architecture/ytplus-cms-dna.test.ts`

Expected: FAIL until the generic runtime migration is complete and the test no
longer treats `CMS_2/src` as the reference source.

- [ ] **Step 3: Rewrite the architecture test and README**

The architecture test must:

- resolve the reference root only from `YTPLUS_CMS_REFERENCE_ROOT`;
- assert the reference directory exists before source comparison;
- assert only explicit, stable DNA invariants (literal route files, `App.vue`
  composition root, generic resource runtime, thin catalog route views);
- avoid claiming endpoint/API parity from source file names alone.

README must remove references to `src/app`, `src/modules`, module registry, and
non-existent module tests. It must document `src/components/resource` and
feature resource declarations as the single owner of standard CRUD transport
and metadata.

- [ ] **Step 4: Run the focused architecture test with the explicit reference root**

Run: `YTPLUS_CMS_REFERENCE_ROOT=/Users/phuongtran/Documents/YTPlus/cms npm run test:unit -- tests/architecture/ytplus-cms-dna.test.ts`

Expected: all architecture assertions pass without pretending the CMS_2 source
tree is YTPlus.

## Task 7: Run The Foundation Quality Gate

**Files:**
- Modify only files exposed by failed verification in Tasks 1-6.

- [ ] **Step 1: Run static checks**

Run: `npm run typecheck && npm run lint`

Expected: both commands exit 0.

- [ ] **Step 2: Run the complete unit suite**

Run: `npm run test:unit`

Expected: all unit and architecture tests pass.

- [ ] **Step 3: Run focused browser coverage for catalog routes**

Run: `npx playwright test tests/e2e/categories.spec.ts`

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
