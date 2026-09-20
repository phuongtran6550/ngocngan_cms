<template>
  <div ref="wrapper" class="dropdown autocomplete-select">
    <input
      type="hidden"
      :name="name"
      :value="modelValue ?? ''"
      :required="required && !hasValue"
    />

    <div
      :id="id"
      ref="trigger"
      tabindex="0"
      role="combobox"
      :aria-expanded="open"
      :aria-haspopup="'listbox'"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="describedBy || undefined"
      class="form-select autocomplete-trigger d-flex align-items-center justify-content-between text-start"
      :class="{
        'is-invalid': invalid,
        disabled: disabled,
        show: open,
      }"
      @click="toggleDropdown"
      @keydown="handleTriggerKeydown"
    >
      <span
        class="text-truncate flex-grow-1 me-2"
        :class="{ 'text-body-tertiary': !hasValue }"
      >
        {{ hasValue ? displayLabel : placeholder }}
      </span>

      <div class="d-flex align-items-center flex-shrink-0 gap-1 ms-auto">
        <button
          v-if="clearable && hasValue && !disabled"
          type="button"
          class="btn-clear border-0 bg-transparent text-body-tertiary p-0 d-inline-flex align-items-center"
          aria-label="Xóa lựa chọn"
          title="Xóa lựa chọn"
          tabindex="-1"
          @click.stop="clear"
        >
          <AppIcon name="close" class="icon-clear" />
        </button>
        <AppIcon
          name="chevron-down"
          class="icon-chevron text-body-tertiary"
          :class="{ 'rotate-180': open }"
        />
      </div>
    </div>

    <div
      v-if="open"
      ref="menu"
      class="dropdown-menu show w-100 p-2 shadow-sm border border-translucent mt-1 autocomplete-menu"
      role="listbox"
    >
      <div class="search-box mb-2 position-relative">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="search"
          class="form-control form-control-sm pe-4"
          :placeholder="searchPlaceholder"
          autocomplete="off"
          @keydown="handleSearchKeydown"
        />
        <AppIcon
          name="search"
          class="position-absolute end-0 top-50 translate-middle-y me-2 text-body-tertiary fs-10 pointer-events-none"
        />
      </div>

      <div
        ref="optionsList"
        class="autocomplete-options-list"
        style="max-height: 220px; overflow-y: auto"
      >
        <div
          v-if="filteredOptions.length === 0"
          class="text-center py-3 text-body-tertiary fs-9"
        >
          {{ emptyText }}
        </div>
        <div
          v-for="(option, index) in filteredOptions"
          :id="`${id}-option-${index}`"
          :key="String(option.value)"
          class="dropdown-item autocomplete-option-item d-flex align-items-center justify-content-between rounded-1 px-2 py-1 fs-9 mb-1"
          :class="{
            active: isSelected(option.value),
            highlighted: index === highlightedIndex && !isSelected(option.value),
          }"
          role="option"
          :aria-selected="isSelected(option.value)"
          @click="selectOption(option)"
          @mouseenter="highlightedIndex = index"
        >
          <span class="text-truncate">{{ option.label }}</span>
          <AppIcon
            v-if="isSelected(option.value)"
            name="check"
            class="fs-10 flex-shrink-0 ms-2 text-primary"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import {
  createDropdownBehavior,
  type DropdownBehavior,
} from "@/components/dropdown/behavior";

export interface AutoCompleteOption {
  value: string | number;
  label: string;
  [key: string]: unknown;
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function matchesSearch(label: string, query: string): boolean {
  if (!query) return true;
  const cleanLabel = removeVietnameseTones(label).toLowerCase();
  const cleanQuery = removeVietnameseTones(query).toLowerCase();
  return cleanLabel.includes(cleanQuery);
}

function normalizeOption(item: unknown): AutoCompleteOption {
  if (typeof item === "string" || typeof item === "number") {
    return { value: item, label: String(item) };
  }
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    const value = obj.value ?? obj.id ?? obj._id ?? "";
    const label = obj.label ?? obj.name ?? obj.title ?? String(value);
    return {
      ...obj,
      value: value as string | number,
      label: String(label),
    };
  }
  return { value: "", label: "" };
}

export default defineComponent({
  name: "AutoCompleteSelect",
  components: { AppIcon },
  props: {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    modelValue: {
      type: [String, Number] as PropType<string | number | null | undefined>,
      default: "",
    },
    options: {
      type: Array as PropType<unknown[]>,
      default: () => [],
    },
    placeholder: { type: String, default: "Chọn..." },
    searchPlaceholder: { type: String, default: "Tìm kiếm..." },
    disabled: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    invalid: { type: Boolean, default: false },
    describedBy: { type: String, default: "" },
    clearable: { type: Boolean, default: true },
    emptyText: { type: String, default: "Không tìm thấy kết quả" },
  },
  emits: ["update:modelValue", "change", "blur"],
  data() {
    return {
      open: false,
      searchQuery: "",
      highlightedIndex: -1,
      dropdown: null as DropdownBehavior | null,
    };
  },
  computed: {
    normalizedOptions(): AutoCompleteOption[] {
      if (!Array.isArray(this.options)) return [];
      return this.options.map(normalizeOption);
    },
    selectedOption(): AutoCompleteOption | undefined {
      const val = this.modelValue;
      if (val === null || val === undefined || val === "") return undefined;
      return this.normalizedOptions.find(
        (opt) => String(opt.value) === String(val),
      );
    },
    displayLabel(): string {
      return this.selectedOption ? this.selectedOption.label : "";
    },
    hasValue(): boolean {
      return this.selectedOption !== undefined;
    },
    filteredOptions(): AutoCompleteOption[] {
      const query = this.searchQuery.trim();
      if (!query) return this.normalizedOptions;
      return this.normalizedOptions.filter((opt) =>
        matchesSearch(opt.label, query),
      );
    },
  },
  watch: {
    filteredOptions(newOptions: AutoCompleteOption[]) {
      if (this.highlightedIndex >= newOptions.length) {
        this.highlightedIndex = newOptions.length - 1;
      }
    },
  },
  mounted() {
    this.dropdown = createDropdownBehavior(
      () => this.$refs.wrapper as HTMLElement | undefined,
      () => {
        if (this.open) this.closeDropdown();
      },
    );
    this.dropdown.mount();
  },
  beforeUnmount() {
    this.dropdown?.dispose();
    this.dropdown = null;
  },
  methods: {
    isSelected(value: string | number): boolean {
      if (this.modelValue === null || this.modelValue === undefined) return false;
      return String(this.modelValue) === String(value);
    },
    toggleDropdown(): void {
      if (this.disabled) return;
      if (this.open) {
        this.closeDropdown();
      } else {
        this.openDropdown();
      }
    },
    openDropdown(): void {
      if (this.disabled || this.open) return;
      this.open = true;
      this.searchQuery = "";
      const selectedIdx = this.filteredOptions.findIndex((opt) =>
        this.isSelected(opt.value),
      );
      this.highlightedIndex = selectedIdx >= 0 ? selectedIdx : 0;
      this.$nextTick(() => {
        (this.$refs.searchInput as HTMLInputElement | undefined)?.focus();
        this.scrollToHighlighted();
      });
    },
    closeDropdown(): void {
      if (!this.open) return;
      this.open = false;
      this.searchQuery = "";
      this.highlightedIndex = -1;
      this.$emit("blur");
    },
    selectOption(option: AutoCompleteOption): void {
      this.$emit("update:modelValue", option.value);
      this.$emit("change", option.value);
      this.closeDropdown();
      (this.$refs.trigger as HTMLElement | undefined)?.focus();
    },
    clear(): void {
      if (this.disabled) return;
      this.$emit("update:modelValue", "");
      this.$emit("change", "");
      this.searchQuery = "";
      (this.$refs.trigger as HTMLElement | undefined)?.focus();
    },
    handleTriggerKeydown(event: KeyboardEvent): void {
      if (this.disabled) return;
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        this.openDropdown();
      }
    },
    handleSearchKeydown(event: KeyboardEvent): void {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (this.filteredOptions.length > 0) {
          this.highlightedIndex =
            (this.highlightedIndex + 1) % this.filteredOptions.length;
          this.scrollToHighlighted();
        }
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (this.filteredOptions.length > 0) {
          this.highlightedIndex =
            (this.highlightedIndex - 1 + this.filteredOptions.length) %
            this.filteredOptions.length;
          this.scrollToHighlighted();
        }
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (
          this.highlightedIndex >= 0 &&
          this.highlightedIndex < this.filteredOptions.length
        ) {
          this.selectOption(this.filteredOptions[this.highlightedIndex]);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        this.closeDropdown();
        (this.$refs.trigger as HTMLElement | undefined)?.focus();
        return;
      }
      if (event.key === "Tab") {
        this.closeDropdown();
      }
    },
    scrollToHighlighted(): void {
      this.$nextTick(() => {
        const listEl = this.$refs.optionsList as HTMLElement | undefined;
        if (!listEl) return;
        const activeEl = listEl.querySelector(
          ".autocomplete-option-item.highlighted, .autocomplete-option-item.active",
        ) as HTMLElement | null;
        if (activeEl) {
          activeEl.scrollIntoView({ block: "nearest" });
        }
      });
    },
  },
});
</script>

<style scoped>
.autocomplete-select {
  position: relative;
  width: 100%;
}

.autocomplete-trigger {
  background-image: none !important;
  cursor: pointer;
  user-select: none;
  min-height: calc(1.5em + 0.75rem + 2px);
  padding-right: 0.75rem !important;
}

.autocomplete-trigger:focus-visible {
  border-color: var(--phoenix-primary, #3874ff);
  box-shadow: 0 0 0 0.25rem rgba(var(--phoenix-primary-rgb, 56, 116, 255), 0.25);
  outline: 0;
}

.autocomplete-trigger.disabled {
  pointer-events: none;
  background-color: var(--phoenix-body-secondary-bg, #f5f7fa);
  opacity: 0.75;
}

.autocomplete-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1050;
  min-width: 100%;
  background-color: var(--phoenix-body-bg, #ffffff);
}

.pointer-events-none {
  pointer-events: none;
}

.icon-chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease-in-out;
}

.icon-chevron.rotate-180 {
  transform: rotate(180deg);
}

.icon-clear {
  width: 13px;
  height: 13px;
}

.btn-clear {
  line-height: 1;
  transition: color 0.15s ease-in-out;
}

.btn-clear:hover {
  color: var(--phoenix-danger, #dc3545) !important;
}

.autocomplete-option-item {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.autocomplete-option-item:hover,
.autocomplete-option-item.highlighted {
  background-color: var(--phoenix-body-tertiary-bg, #edf2f9);
}

.autocomplete-option-item.active {
  background-color: rgba(var(--phoenix-primary-rgb, 56, 116, 255), 0.1) !important;
  color: var(--phoenix-primary, #3874ff) !important;
  font-weight: 600;
}
</style>
