import type { FormFieldDefinition } from "@/config/resource";

export interface FormFieldContext {
  field: FormFieldDefinition;
  inputId: string;
  modelValue?: unknown;
}
