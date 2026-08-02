export type TableCellType =
  | "text"
  | "number"
  | "money"
  | "dollar"
  | "date"
  | "time"
  | "datetime"
  | "badge"
  | "status"
  | "switch"
  | "image"
  | "profile"
  | "product"
  | "group_text"
  | "tags"
  | "texts"
  | "duration"
  | "copy"
  | "hyperlink"
  | "stt"
  | "authen"
  | "icon"
  | "icons"
  | "video"
  | "barChart"
  | "textIsRead"
  | "action"
  | "boolean"
  | "default";

export type ColumnDisplayMode = "both" | "table" | "card";

export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "money"
  | "date"
  | "datetime"
  | "select"
  | "dropdown"
  | "auto_complete"
  | "textarea"
  | "password"
  | "switch"
  | "file"
  | "fileupload"
  | "hidden";

export interface PermissionSet {
  view?: string;
  create?: string;
  update?: string;
  delete?: string;
}

export interface BreadcrumbDefinition {
  link?: string | null;
  text: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface GroupTextDisplayItem {
  key: string;
  label?: string;
  strong?: boolean;
}

export interface CellDisplayDefinition {
  avatar?: string | false;
  title?: string;
  desc?: string;
  badge?: string;
  type?: string;
  name?: string;
  join?: string;
  url?: string;
  classAvatar?: string;
  isBold?: string;
}

export interface TableCellActionDefinition {
  key: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  type: TableCellType;
  displayIn?: ColumnDisplayMode;
  sortable?: boolean;
  visible?: boolean;
  options?: SelectOption[];
  width?: string;
  display?: CellDisplayDefinition;
  groupItems?: GroupTextDisplayItem[];
  actions?: TableCellActionDefinition[];
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: SelectOption[];
  min?: number;
  max?: number;
  maxLength?: number;
  step?: number;
  disabled?: boolean;
  readonly?: boolean;
  multiple?: boolean;
  accept?: string;
  rows?: number;
  autocomplete?: string;
  value?: unknown;
  span?: 1 | 2 | 3 | 4 | 6 | 12;
}

export interface FormDefinition {
  fields: FormFieldDefinition[];
}

/** Mirrors the public declarative ListLayout contract used by YTPlus pages. */
export interface ListActionDefinition {
  add?: boolean;
  delete?: boolean;
  detail?: boolean;
  edit?: boolean;
  fieldSelector?: boolean;
  refresh?: boolean;
  view?: boolean;
}

export interface ListFilterTabDefinition {
  label: string;
  value: string | number;
  countKey?: string;
}

export interface ListFilterDefinition {
  fields?: FormFieldDefinition[];
  initial?: Record<string, unknown>;
  textbox?: string;
  tabs?: ListFilterTabDefinition[];
}

export interface ListFormDefinition extends FormDefinition {
  initial?: Record<string, unknown>;
}

export interface ResourceActions {
  view?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  refresh?: boolean;
  fieldSelector?: boolean;
}

export interface ResourceDefinition {
  key: string;
  title: string;
  breadcrumbs?: BreadcrumbDefinition[];
  description?: string;
  endpoint: string;
  permission: PermissionSet;
  columns: ColumnDefinition[];
  tableMinWidth?: string;
  filters?: FormFieldDefinition[];
  form?: FormDefinition;
  actions: ResourceActions;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ResourceRow = Record<string, unknown> & { id: string };
