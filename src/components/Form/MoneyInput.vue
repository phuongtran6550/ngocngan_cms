<template>
  <div class="input-group">
    <input
      :id="id"
      class="form-control"
      :class="{ 'is-invalid': invalid }"
      :name="name"
      type="text"
      inputmode="numeric"
      pattern="[0-9,]*"
      :value="formattedValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="describedBy || undefined"
      @input="update"
    />
    <span class="input-group-text">₫</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
  name: "MoneyInput",
  props: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    modelValue: { type: Number as PropType<number | null>, default: null },
    placeholder: { type: String, default: "0" },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    invalid: { type: Boolean, default: false },
    describedBy: { type: String, default: "" },
  },
  emits: ["update:modelValue"],
  computed: {
    formattedValue(): string {
      return this.format(this.modelValue);
    },
  },
  methods: {
    format(value: number | null): string {
      if (value === null || !Number.isFinite(value)) return "";
      return Math.trunc(value).toLocaleString("en-US");
    },
    update(event: Event): void {
      const input = event.target as HTMLInputElement;
      const digits = input.value.replace(/\D/g, "");
      const value = digits ? Number(digits) : null;
      input.value = this.format(value);
      this.$emit("update:modelValue", value);
    },
  },
});
</script>
