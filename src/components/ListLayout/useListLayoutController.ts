import { ref, type Ref } from "vue";
import { apiError } from "@/request";
import { resourceRequest } from "@/request/resource-client";
import type {
  FormFieldDefinition,
  ListActionDefinition,
  ListFilterDefinition,
  ListFormDefinition,
  PaginationState,
  ResourceRow,
} from "@/config/resource";

type FormModel = Record<string, unknown>;

interface ListResponse {
  items: ResourceRow[];
  limit: number;
  page: number;
  summary: Record<string, number>;
  total: number;
  totalPages: number;
}

interface ListLayoutControllerOptions {
  action: ListActionDefinition;
  endpoint: string;
  filter?: ListFilterDefinition;
  form?: ListFormDefinition;
}

export interface ListLayoutController {
  closeDrawer(): void;
  confirmDelete(): Promise<void>;
  deleteTarget: Ref<ResourceRow | null>;
  drawerOpen: Ref<boolean>;
  editing: Ref<ResourceRow | null>;
  error: Ref<string>;
  filters: Ref<Record<string, unknown>>;
  form: Ref<FormModel>;
  items: Ref<ResourceRow[]>;
  load(page?: number): Promise<void>;
  loading: Ref<boolean>;
  message: Ref<string>;
  openCreate(): void;
  openEdit(row: ResourceRow): void;
  pagination: Ref<PaginationState>;
  query: Ref<string>;
  requestDelete(row: ResourceRow): void;
  save(input: FormModel): Promise<void>;
  selectedColumns: Ref<string[]>;
  setFilter(key: string, value: unknown): Promise<void>;
  setSelectedColumns(columns: string[]): void;
  summary: Ref<Record<string, number>>;
  sortBy: Ref<string>;
  sortDirection: Ref<"asc" | "desc">;
  applySort(key: string, sortable: boolean): Promise<void>;
  submitting: Ref<boolean>;
  dispose(): void;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function numericValue(value: unknown, fallback: number): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function numericSummary(...sources: Array<Record<string, unknown> | null>): Record<string, number> {
  return Object.assign({}, ...sources.map((source) => Object.fromEntries(
    Object.entries(source || [])
      .filter(([, value]) => Number.isFinite(Number(value)))
      .map(([key, value]) => [key, Number(value)]),
  )));
}

function normalizeListResponse(payload: unknown, fallback: PaginationState): ListResponse {
  if (Array.isArray(payload)) {
    return {
      items: payload as ResourceRow[],
      page: fallback.page,
      limit: fallback.limit,
      total: payload.length,
      totalPages: payload.length ? 1 : 0,
      summary: { total: payload.length },
    };
  }

  const response = asRecord(payload);
  if (!response) throw new TypeError("List endpoint must return an object or an array.");

  const nested = asRecord(response.items) || asRecord(response.data);
  const items = Array.isArray(response.items)
    ? response.items
    : Array.isArray(response.data)
      ? response.data
      : nested && (Array.isArray(nested.items) ? nested.items : nested.data);
  if (!Array.isArray(items)) {
    throw new TypeError("List endpoint response must contain an items array.");
  }

  const metadata = nested || response;
  const page = numericValue(metadata.page ?? response.page, fallback.page);
  const limit = numericValue(metadata.limit ?? metadata.take ?? response.limit, fallback.limit);
  const total = numericValue(
    metadata.total ?? metadata.itemCount ?? response.total ?? response.itemCount,
    items.length,
  );
  const totalPages = numericValue(
    metadata.totalPages ?? metadata.pageCount ?? response.totalPages ?? response.pageCount,
    total ? Math.ceil(total / limit) : 0,
  );

  return {
    items: items as ResourceRow[],
    page,
    limit,
    total,
    totalPages,
    summary: numericSummary(response, nested),
  };
}

function initialValue(field: FormFieldDefinition): unknown {
  if (field.value !== undefined) return field.value;
  if (field.multiple) return [];
  if (field.type === "switch") return false;
  return "";
}

function emptyForm(form?: ListFormDefinition): FormModel {
  if (!form) return {};
  return Object.fromEntries(form.fields.map((field) => [field.key, initialValue(field)]));
}

function formFromRow(row: ResourceRow, form?: ListFormDefinition): FormModel {
  if (!form) return {};
  return Object.fromEntries(form.fields.map((field) => [field.key, row[field.key] ?? initialValue(field)]));
}

export function useListLayoutController(
  options: ListLayoutControllerOptions,
  columns: Ref<Array<{ key: string; sortable?: boolean; visible?: boolean }>>,
): ListLayoutController {
  const items = ref<ResourceRow[]>([]);
  const pagination = ref<PaginationState>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const query = ref("");
  const filters = ref({ ...(options.filter?.initial || {}) });
  const sortBy = ref("");
  const sortDirection = ref<"asc" | "desc">("asc");
  const selectedColumns = ref(columns.value.filter((column) => column.visible !== false).map((column) => column.key));
  const summary = ref<Record<string, number>>({});
  const loading = ref(false);
  const submitting = ref(false);
  const error = ref("");
  const message = ref("");
  const drawerOpen = ref(false);
  const editing = ref<ResourceRow | null>(null);
  const form = ref<FormModel>(emptyForm(options.form));
  const deleteTarget = ref<ResourceRow | null>(null);

  let requestController: AbortController | null = null;
  let requestId = 0;

  async function load(page = pagination.value.page): Promise<void> {
    requestController?.abort();
    requestController = new AbortController();
    const controller = requestController;
    const currentRequestId = ++requestId;
    loading.value = true;
    error.value = "";

    try {
      const result = await resourceRequest<unknown>({
        method: "get",
        url: options.endpoint,
        params: {
          page,
          limit: pagination.value.limit,
          query: query.value || undefined,
          sortBy: sortBy.value || undefined,
          sortDirection: sortBy.value ? sortDirection.value : undefined,
          ...filters.value,
        },
        signal: controller.signal,
      });
      if (currentRequestId !== requestId) return;
      const list = normalizeListResponse(result.response, pagination.value);
      items.value = list.items;
      summary.value = list.summary;
      pagination.value = {
        page: list.page,
        limit: list.limit,
        total: list.total,
        totalPages: list.totalPages,
      };
    } catch (caught) {
      if (currentRequestId !== requestId) return;
      const normalized = apiError(caught);
      if (normalized.code !== "ERR_CANCELED") error.value = normalized.message;
    } finally {
      if (currentRequestId === requestId) loading.value = false;
    }
  }

  async function setFilter(key: string, value: unknown): Promise<void> {
    filters.value = { ...filters.value, [key]: value };
    await load(1);
  }

  async function applySort(key: string, sortable: boolean): Promise<void> {
    if (!sortable) return;
    if (sortBy.value === key) {
      sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    } else {
      sortBy.value = key;
      sortDirection.value = "asc";
    }
    await load(1);
  }

  function setSelectedColumns(nextColumns: string[]): void {
    if (nextColumns.length) selectedColumns.value = nextColumns;
  }

  function openCreate(): void {
    editing.value = null;
    form.value = { ...(options.form?.initial || emptyForm(options.form)) };
    drawerOpen.value = true;
    error.value = "";
  }

  function openEdit(row: ResourceRow): void {
    editing.value = row;
    form.value = formFromRow(row, options.form);
    drawerOpen.value = true;
    error.value = "";
  }

  function closeDrawer(): void {
    drawerOpen.value = false;
    editing.value = null;
  }

  async function save(input: FormModel): Promise<void> {
    if (!options.form) return;
    submitting.value = true;
    error.value = "";
    try {
      if (editing.value) {
        await resourceRequest({ method: "patch", url: `${options.endpoint}/${editing.value.id}`, data: input });
        message.value = "Đã cập nhật bản ghi";
      } else {
        await resourceRequest({ method: "post", url: options.endpoint, data: input });
        message.value = "Đã thêm bản ghi";
      }
      closeDrawer();
      await load(pagination.value.page);
    } catch (caught) {
      error.value = apiError(caught).message;
    } finally {
      submitting.value = false;
    }
  }

  function requestDelete(row: ResourceRow): void {
    deleteTarget.value = row;
    error.value = "";
  }

  async function confirmDelete(): Promise<void> {
    const target = deleteTarget.value;
    if (!target) return;
    deleteTarget.value = null;
    error.value = "";
    try {
      await resourceRequest({ method: "delete", url: `${options.endpoint}/${target.id}` });
      message.value = "Đã xóa bản ghi";
      await load(items.value.length === 1 && pagination.value.page > 1
        ? pagination.value.page - 1
        : pagination.value.page);
    } catch (caught) {
      error.value = apiError(caught).message;
    }
  }

  function dispose(): void {
    requestController?.abort();
    requestId += 1;
    loading.value = false;
  }

  return {
    closeDrawer,
    confirmDelete,
    deleteTarget,
    drawerOpen,
    editing,
    error,
    filters,
    form,
    items,
    load,
    loading,
    message,
    openCreate,
    openEdit,
    pagination,
    query,
    requestDelete,
    save,
    selectedColumns,
    setFilter,
    setSelectedColumns,
    summary,
    sortBy,
    sortDirection,
    applySort,
    submitting,
    dispose,
  };
}
