<template>
  <form class="row" novalidate @submit.prevent="submit">
    <div v-for="field in definition.fields" :key="field.key" class="col-12" :class="field.span ? `col-md-${field.span}` : ''">
      <DynamicField
        :field="field"
        :model-value="fieldValue(field.key)"
        :error="fieldError(field.key)"
        @update:model-value="updateField(field.key, $event)"
      />
    </div>
    <div class="col-12 d-flex justify-content-end gap-2 pt-2">
      <button v-if="showCancel" type="button" class="btn btn-phoenix-secondary" @click="$emit('cancel')">Hủy</button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitting ? "Đang lưu..." : submitLabel }}</button>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import DynamicField from "@/components/Form/DynamicField.vue";
import type { FormDefinition } from "@/config/resource";

type FormModel = object;
type FormDraft = Record<string, unknown>;

export default defineComponent({
  name: "FormLayout",
  components: { DynamicField },
  props: {
    definition: { type: Object as PropType<FormDefinition>, required: true },
    modelValue: { type: Object as PropType<FormModel>, default: () => ({}) },
    submitting: { type: Boolean, default: false },
    errors: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
    submitLabel: { type: String, default: "Lưu" },
    showCancel: { type: Boolean, default: true },
  },
  emits: ["update:modelValue", "submit", "cancel"],
  data() {
    return {
      draft: { ...this.modelValue } as FormDraft,
      validationErrors: {} as Record<string, string>,
    };
  },
  watch: {
    modelValue: { deep: true, handler(value: FormModel) { this.draft = { ...value }; } },
  },
  methods: {
    fieldValue(key: string): unknown {
      return this.draft[key];
    },
    fieldError(key: string): string {
      return this.validationErrors[key] || this.errors[key] || "";
    },
    isEmpty(value: unknown): boolean {
      if (typeof value === "string") return value.trim() === "";
      if (Array.isArray(value)) return value.length === 0;
      return value === null || value === undefined;
    },
    updateField(key: string, value: unknown): void {
      this.draft = { ...this.draft, [key]: value };
      if (this.validationErrors[key] && !this.isEmpty(value)) {
        const { [key]: _removed, ...remainingErrors } = this.validationErrors;
        this.validationErrors = remainingErrors;
      }
      this.$emit("update:modelValue", { ...this.draft });
    },
    submit(): void {
      this.validationErrors = Object.fromEntries(
        this.definition.fields
          .filter((field) => field.required && this.isEmpty(this.draft[field.key]))
          .map((field) => [field.key, `${field.label} là bắt buộc`]),
      );
      if (Object.keys(this.validationErrors).length) return;

      const allowed = new Set(this.definition.fields.map((field) => field.key));
      const payload = Object.fromEntries(Object.entries(this.draft).filter(([key]) => allowed.has(key)));
      this.$emit("submit", payload);
    },
  },
});
</script>
