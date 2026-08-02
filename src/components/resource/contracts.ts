import type { ResourceDefinition, ResourceRow } from "@/config/resource";

export type ResourceRowModel = { id: string };

export interface ResourceListResult<Row extends ResourceRowModel> {
  items: Row[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResourceListInput<Filters> {
  page: number;
  limit: number;
  query: string;
  filters: Filters;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

/** Transport shared by aggregate pages and mutable resources. */
export interface ResourceListTransport<Row extends ResourceRowModel, Filters> {
  list(input: ResourceListInput<Filters>, signal?: AbortSignal): Promise<ResourceListResult<Row>>;
  detail?(id: string, signal?: AbortSignal): Promise<Row>;
}

/** The full CRUD transport used by resources that own mutations. */
export interface ResourceTransport<Row extends ResourceRowModel, FormModel, Filters>
  extends ResourceListTransport<Row, Filters> {
  create(input: FormModel): Promise<Row>;
  update(id: string, input: FormModel): Promise<Row>;
  remove(id: string): Promise<void>;
}

export interface ResourceLabels {
  singular: string;
  create: string;
  update: string;
  delete: string;
}

interface ResourceDeclarationBase<
  Row extends ResourceRowModel,
  Filters,
> {
  key: string;
  definition: ResourceDefinition;
  initialFilters: Filters;
  selectedColumns: string[];
  initialSort: { by: string; direction: "asc" | "desc" };
  /** Permission required by a row's view action when it opens another domain. */
  viewPermission?: string;
  /** Maps a domain row to the table-only fields needed by the shared page. */
  rowForTable?(row: Row): ResourceRow;
  labels?: ResourceLabels;
  canUpdate?(row: Row): boolean;
  canDelete?(row: Row): string | undefined;
  errorMessage?(error: unknown, row?: Row): string | undefined;
}

export interface ResourceDeclaration<
  Row extends ResourceRowModel,
  FormModel,
  Filters,
> extends ResourceDeclarationBase<Row, Filters> {
  mode?: "crud";
  emptyForm(): FormModel;
  formFromRow(row: Row): FormModel;
  labels: ResourceLabels;
  transport: ResourceTransport<Row, FormModel, Filters>;
}

/**
 * Aggregate resources have no writable API contract. This keeps the UI from
 * offering create, edit, or delete controls that the backend cannot honor.
 */
export interface ReadonlyResourceDeclaration<
  Row extends ResourceRowModel,
  Filters,
> extends ResourceDeclarationBase<Row, Filters> {
  mode: "readonly";
  transport: ResourceListTransport<Row, Filters>;
}

export type ResourceRuntimeDeclaration<
  Row extends ResourceRowModel,
  FormModel,
  Filters,
> = ResourceDeclaration<Row, FormModel, Filters> | ReadonlyResourceDeclaration<Row, Filters>;

/** Keeps each feature declaration typed without adding a second factory layer. */
export function defineResource<
  Row extends ResourceRowModel,
  FormModel,
  Filters,
>(declaration: ResourceDeclaration<Row, FormModel, Filters>): ResourceDeclaration<Row, FormModel, Filters> {
  return declaration;
}

export function defineReadonlyResource<
  Row extends ResourceRowModel,
  Filters,
>(declaration: ReadonlyResourceDeclaration<Row, Filters>): ReadonlyResourceDeclaration<Row, Filters> {
  return declaration;
}
