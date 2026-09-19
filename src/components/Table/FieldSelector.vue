<template>
  <div ref="menu" class="dropdown">
    <button
      type="button"
      class="btn btn-phoenix-secondary"
      data-testid="field-selector-toggle"
      :aria-expanded="open"
      @click.stop="open = !open"
    >
      Cột hiển thị
    </button>
    <div v-if="open" class="dropdown-menu dropdown-menu-end p-3 show">
      <label
        v-for="column in columns"
        :key="column.key"
        class="form-check d-flex gap-2 mb-2"
      >
        <input
          class="form-check-input"
          type="checkbox"
          :checked="selected.includes(column.key)"
          @change="toggle(column.key)"
        />
        <span class="form-check-label">{{ column.label }}</span>
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import {
  createDropdownBehavior,
  type DropdownBehavior,
} from "@/components/dropdown/behavior";
import type { ColumnDefinition } from "@/config/resource";

export default defineComponent({
  name: "FieldSelector",
  props: {
    columns: { type: Array as PropType<ColumnDefinition[]>, required: true },
    selected: { type: Array as PropType<string[]>, required: true },
  },
  emits: ["update"],
  data() {
    return {
      open: false,
      dropdown: null as DropdownBehavior | null,
    };
  },
  mounted() {
    this.dropdown = createDropdownBehavior(
      () => this.$refs.menu as HTMLElement | undefined,
      () => {
        this.open = false;
      },
    );
    this.dropdown.mount();
  },
  beforeUnmount() {
    this.dropdown?.dispose();
  },
  methods: {
    toggle(key: string): void {
      const next = this.selected.includes(key)
        ? this.selected.filter((item) => item !== key)
        : [...this.selected, key];
      this.$emit("update", next);
    },
  },
});
</script>
