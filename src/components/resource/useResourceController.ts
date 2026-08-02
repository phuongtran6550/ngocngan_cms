import { ref, type Ref } from "vue";
import { apiError } from "@/request";
import type { PaginationState } from "@/config/resource";
import type {
  ResourceDeclaration,
  ResourceRowModel,
  ResourceRuntimeDeclaration,
} from "@/components/resource/contracts";

function isMutableResource<
  Row extends ResourceRowModel,
  FormModel,
  Filters extends object,
>(
  declaration: ResourceRuntimeDeclaration<Row, FormModel, Filters>,
): declaration is ResourceDeclaration<Row, FormModel, Filters> {
  return declaration.mode !== "readonly";
}

export interface ResourceController<
  Row extends ResourceRowModel,
  FormModel,
  Filters extends object,
> {
  items: Ref<Row[]>;
  pagination: Ref<PaginationState>;
  query: Ref<string>;
  filters: Ref<Filters>;
  sortBy: Ref<string>;
  sortDirection: Ref<"asc" | "desc">;
  selectedColumns: Ref<string[]>;
  isMutable: boolean;
  loading: Ref<boolean>;
  submitting: Ref<boolean>;
  error: Ref<string>;
  message: Ref<string>;
  drawerOpen: Ref<boolean>;
  editing: Ref<Row | null>;
  form: Ref<FormModel | null>;
  deleteTarget: Ref<Row | null>;
  load(page?: number): Promise<void>;
  applySearch(query: string): Promise<void>;
  setFilter<Key extends keyof Filters>(key: Key, value: Filters[Key]): Promise<void>;
  applySort(key: string): Promise<void>;
  setSelectedColumns(columns: string[]): void;
  openCreate(): void;
  openEdit(row: Row): void;
  closeDrawer(): void;
  save(input: FormModel): Promise<void>;
  requestDelete(row: Row): void;
  cancelDelete(): void;
  confirmDelete(): Promise<void>;
  dispose(): void;
}

export function useResourceController<
  Row extends ResourceRowModel,
  FormModel,
  Filters extends object,
>(
  declaration: ResourceRuntimeDeclaration<Row, FormModel, Filters>,
): ResourceController<Row, FormModel, Filters> {
  const items = ref<Row[]>([]);
  const pagination = ref<PaginationState>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const query = ref("");
  const filters = ref({ ...declaration.initialFilters }) as Ref<Filters>;
  const sortBy = ref(declaration.initialSort.by);
  const sortDirection = ref<"asc" | "desc">(declaration.initialSort.direction);
  const selectedColumns = ref([...declaration.selectedColumns]);
  const mutableResource = isMutableResource(declaration) ? declaration : null;
  const loading = ref(false);
  const submitting = ref(false);
  const error = ref("");
  const message = ref("");
  const drawerOpen = ref(false);
  const editing = ref<Row | null>(null);
  const form = ref(mutableResource?.emptyForm() ?? null) as Ref<FormModel | null>;
  const deleteTarget = ref<Row | null>(null);

  let listController: AbortController | null = null;
  let listRequestId = 0;

  function displayError(caught: unknown, row?: Row): string {
    return declaration.errorMessage?.(caught, row) || apiError(caught).message;
  }

  async function load(page = pagination.value.page): Promise<void> {
    listController?.abort();
    listController = new AbortController();
    const controller = listController;
    const requestId = ++listRequestId;
    loading.value = true;
    error.value = "";

    try {
      const result = await declaration.transport.list({
        page,
        limit: pagination.value.limit,
        query: query.value,
        filters: { ...filters.value },
        sortBy: sortBy.value,
        sortDirection: sortDirection.value,
      }, controller.signal);
      if (requestId !== listRequestId) return;
      items.value = result.items;
      pagination.value = {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      };
    } catch (caught) {
      if (requestId !== listRequestId) return;
      const normalized = apiError(caught);
      if (normalized.code !== "ERR_CANCELED") error.value = displayError(caught);
    } finally {
      if (requestId === listRequestId) loading.value = false;
    }
  }

  async function applySearch(value: string): Promise<void> {
    query.value = value.trim();
    await load(1);
  }

  async function setFilter<Key extends keyof Filters>(
    key: Key,
    value: Filters[Key],
  ): Promise<void> {
    filters.value = { ...filters.value, [key]: value } as Filters;
    await load(1);
  }

  async function applySort(key: string): Promise<void> {
    const column = declaration.definition.columns.find((item) => item.key === key);
    if (!column?.sortable) return;

    if (sortBy.value === key) {
      sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    } else {
      sortBy.value = key;
      sortDirection.value = "asc";
    }
    await load(1);
  }

  function setSelectedColumns(columns: string[]): void {
    if (columns.length) selectedColumns.value = columns;
  }

  function openCreate(): void {
    if (!mutableResource) return;
    editing.value = null;
    form.value = mutableResource.emptyForm();
    drawerOpen.value = true;
    error.value = "";
  }

  function openEdit(row: Row): void {
    if (!mutableResource) return;
    editing.value = row;
    form.value = mutableResource.formFromRow(row);
    drawerOpen.value = true;
    error.value = "";
  }

  function closeDrawer(): void {
    drawerOpen.value = false;
    editing.value = null;
    error.value = "";
  }

  async function save(input: FormModel): Promise<void> {
    if (!mutableResource) return;
    submitting.value = true;
    error.value = "";
    try {
      if (editing.value) {
        await mutableResource.transport.update(editing.value.id, input);
        message.value = mutableResource.labels.update;
      } else {
        await mutableResource.transport.create(input);
        message.value = mutableResource.labels.create;
      }
      closeDrawer();
      await load(pagination.value.page);
    } catch (caught) {
      error.value = displayError(caught, editing.value || undefined);
    } finally {
      submitting.value = false;
    }
  }

  function requestDelete(row: Row): void {
    if (!mutableResource) return;
    const guardedMessage = declaration.canDelete?.(row);
    if (guardedMessage) {
      deleteTarget.value = null;
      error.value = guardedMessage;
      return;
    }
    error.value = "";
    deleteTarget.value = row;
  }

  function cancelDelete(): void {
    deleteTarget.value = null;
  }

  async function confirmDelete(): Promise<void> {
    const target = deleteTarget.value;
    if (!target || !mutableResource) return;

    deleteTarget.value = null;
    error.value = "";
    try {
      await mutableResource.transport.remove(target.id);
      message.value = mutableResource.labels.delete;
      const nextPage = items.value.length === 1 && pagination.value.page > 1
        ? pagination.value.page - 1
        : pagination.value.page;
      await load(nextPage);
    } catch (caught) {
      error.value = displayError(caught, target);
    }
  }

  function dispose(): void {
    listController?.abort();
    listRequestId += 1;
    loading.value = false;
  }

  return {
    items,
    pagination,
    query,
    filters,
    sortBy,
    sortDirection,
    selectedColumns,
    isMutable: Boolean(mutableResource),
    loading,
    submitting,
    error,
    message,
    drawerOpen,
    editing,
    form,
    deleteTarget,
    load,
    applySearch,
    setFilter,
    applySort,
    setSelectedColumns,
    openCreate,
    openEdit,
    closeDrawer,
    save,
    requestDelete,
    cancelDelete,
    confirmDelete,
    dispose,
  };
}
