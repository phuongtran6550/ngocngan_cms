import type { Component } from "vue";
import type { FormFieldType } from "@/config/resource";
import AutoCompleteField from "@/components/Form/fields/AutoCompleteField.vue";
import FileField from "@/components/Form/fields/FileField.vue";
import HiddenField from "@/components/Form/fields/HiddenField.vue";
import SelectField from "@/components/Form/fields/SelectField.vue";
import SwitchField from "@/components/Form/fields/SwitchField.vue";
import TextareaField from "@/components/Form/fields/TextareaField.vue";
import TextInputField from "@/components/Form/fields/TextInputField.vue";

const fields: Record<FormFieldType, Component> = {
  auto_complete: AutoCompleteField,
  date: TextInputField,
  datetime: TextInputField,
  dropdown: SelectField,
  email: TextInputField,
  file: FileField,
  fileupload: FileField,
  hidden: HiddenField,
  money: TextInputField,
  number: TextInputField,
  password: TextInputField,
  select: SelectField,
  switch: SwitchField,
  tel: TextInputField,
  text: TextInputField,
  textarea: TextareaField,
  url: TextInputField,
};

export function resolveFormField(type: FormFieldType): Component {
  return fields[type] || TextInputField;
}
