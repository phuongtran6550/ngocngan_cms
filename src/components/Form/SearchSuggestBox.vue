<template>
  <div
    ref="wrapperRef"
    class="search-suggest-box position-relative"
    :class="{ 'is-open': isOpen, 'is-loading': loading }"
  >
    <div class="position-relative d-flex align-items-center">
      <input
        :id="id"
        ref="inputRef"
        :value="modelValue"
        type="search"
        class="form-control"
        :class="[
          inputClass,
          size === 'sm' ? 'form-control-sm' : '',
          rounded ? 'rounded-pill' : '',
        ]"
        :placeholder="placeholder"
        :disabled="disabled"
        :autofocus="autofocus"
        autocomplete="off"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-controls="listId"
        :aria-activedescendant="activeDescendantId"
        @input="handleInput"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />
      <span
        v-if="loading"
        class="spinner-border spinner-border-sm text-secondary position-absolute end-0 me-3 pointer-events-none"
        style="width: 0.9rem; height: 0.9rem;"
        role="status"
        aria-hidden="true"
      />
      <AppIcon
        v-else-if="showSearchIcon"
        name="search"
        class="search-icon text-body-tertiary position-absolute pointer-events-none"
        :class="searchIconClass"
      />
    </div>

    <!-- Dropdown Menu Gợi ý từ Database -->
    <div
      v-if="isOpen"
      :id="listId"
      ref="dropdownRef"
      class="dropdown-menu show shadow-lg border border-translucent mt-1 py-2 w-100 search-suggest-dropdown"
      role="listbox"
    >
      <!-- Loading State -->
      <div v-if="loading && !suggestions.length" class="px-3 py-2 text-center text-body-tertiary fs-9">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
        Đang tìm trong cơ sở dữ liệu...
      </div>

      <!-- Không có kết quả -->
      <div
        v-else-if="!suggestions.length && hasSearched && trimmedQuery"
        class="px-3 py-3 text-center text-body-tertiary fs-9"
      >
        <p class="mb-2">Không tìm thấy dữ liệu phù hợp với “<strong>{{ trimmedQuery }}</strong>”</p>
        <button
          type="button"
          class="btn btn-sm btn-subtle-primary py-1 px-3 fs-10"
          @click="submitDirectSearch"
        >
          Vẫn tìm kiếm trên bảng
        </button>
      </div>

      <!-- Danh sách gợi ý -->
      <div v-else-if="suggestions.length" class="suggest-items-wrapper">
        <div class="dropdown-header text-uppercase fs-10 fw-bold px-3 py-1 text-body-secondary d-flex justify-content-between align-items-center">
          <span>Gợi ý từ database</span>
          <span class="badge text-bg-secondary-subtle fs-10 fw-normal">{{ suggestions.length }} kết quả</span>
        </div>

        <div
          v-for="(item, index) in suggestions"
          :id="`${id}-suggest-${index}`"
          :key="item.id || index"
          class="dropdown-item suggest-item d-flex align-items-center gap-2 px-3 py-2"
          :class="{
            'active': index === highlightedIndex,
            'is-highlighted': index === highlightedIndex,
          }"
          role="option"
          :aria-selected="index === highlightedIndex"
          @mouseenter="highlightedIndex = index"
          @click="selectItem(item)"
        >
          <!-- Thumbnail -->
          <div class="suggest-item__thumb flex-shrink-0">
            <img
              v-if="item.thumbnail"
              :src="item.thumbnail"
              :alt="item.title"
              class="rounded-2 object-fit-cover"
              width="36"
              height="36"
              @error="handleImageError"
            />
            <div
              v-else
              class="suggest-item__placeholder rounded-2 d-flex align-items-center justify-content-center text-body-tertiary"
            >
              <AppIcon :name="mode === 'products' ? 'gem' : 'archive'" class="fs-8" />
            </div>
          </div>

          <!-- Nội dung chính -->
          <div class="suggest-item__info min-w-0 flex-grow-1">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="suggest-item__title text-truncate fw-bold fs-9 text-body-highlight">
                {{ item.title }}
              </span>
              <span
                v-if="item.badge"
                class="badge badge-phoenix badge-phoenix-info fs-10 font-monospace py-0 px-1"
              >
                {{ item.badge }}
              </span>
            </div>

            <div class="d-flex align-items-center gap-2 fs-10 text-body-tertiary text-truncate">
              <span v-if="item.subtitle" class="text-truncate">{{ item.subtitle }}</span>
              <span v-if="typeof item.stock === 'number'" class="text-nowrap ms-auto">
                Tồn: <strong :class="item.stock <= 2 ? 'text-danger' : 'text-success'">{{ item.stock }}</strong>
              </span>
            </div>
          </div>

          <!-- Giá bán & Hành động điền từ khóa -->
          <div class="suggest-item__action flex-shrink-0 text-end">
            <div v-if="typeof item.price === 'number'" class="fs-9 fw-semibold text-primary text-nowrap">
              {{ formatPrice(item.price) }}
            </div>
            <button
              type="button"
              class="btn btn-link p-0 text-body-tertiary hover-text-primary text-decoration-none fs-10 d-inline-flex align-items-center gap-1 mt-1"
              title="Điền từ khóa vào ô tìm kiếm"
              @click.stop="fillSearchQuery(item)"
            >
              <AppIcon name="corner-down-left" class="fs-10" />
              <span>Điền</span>
            </button>
          </div>
        </div>

        <!-- Footer: Xem toàn bộ kết quả -->
        <div class="border-top border-translucent mt-1 pt-1 px-3 py-1 d-flex justify-content-between align-items-center">
          <small class="text-body-tertiary fs-10">Nhấn Enter để tìm tất cả</small>
          <button
            type="button"
            class="btn btn-link btn-sm p-0 fs-10 fw-semibold text-primary text-decoration-none"
            @click="submitDirectSearch"
          >
            Tìm trên bảng “{{ trimmedQuery }}” &rarr;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AppIcon from "@/components/ui/AppIcon.vue";
import { formatMoney } from "@/utils/resource-display";
import {
  fetchSearchSuggestions,
  type SearchSuggestionItem,
  type SearchSuggestMode,
} from "@/components/Form/search-suggestion";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    mode: SearchSuggestMode;
    placeholder?: string;
    id?: string;
    size?: "sm" | "md";
    rounded?: boolean;
    inputClass?: string;
    disabled?: boolean;
    autofocus?: boolean;
    showSearchIcon?: boolean;
    searchIconPosition?: "left" | "right";
    navigateOnSelect?: boolean;
  }>(),
  {
    placeholder: "Tìm kiếm...",
    id: "search-suggest-input",
    size: "md",
    rounded: false,
    inputClass: "",
    disabled: false,
    autofocus: false,
    showSearchIcon: true,
    searchIconPosition: "left",
    navigateOnSelect: true,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "search": [query: string];
  "select": [item: SearchSuggestionItem];
}>();

const router = useRouter();
const wrapperRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

const isOpen = ref(false);
const loading = ref(false);
const hasSearched = ref(false);
const suggestions = ref<SearchSuggestionItem[]>([]);
const highlightedIndex = ref(-1);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let abortController: AbortController | null = null;

const listId = computed(() => `${props.id}-listbox`);
const trimmedQuery = computed(() => props.modelValue.trim());

const activeDescendantId = computed(() => {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
    return `${props.id}-suggest-${highlightedIndex.value}`;
  }
  return undefined;
});

const searchIconClass = computed(() => {
  if (props.searchIconPosition === "right") {
    return "end-0 top-50 translate-middle-y me-3 fs-9";
  }
  return "start-0 top-50 translate-middle-y ms-3 fs-9";
});

function formatPrice(val: number): string {
  return formatMoney(val);
}

function handleImageError(event: Event): void {
  const target = event.currentTarget as HTMLImageElement;
  target.style.display = "none";
}

function handleInput(event: Event): void {
  const value = (event.currentTarget as HTMLInputElement).value;
  emit("update:modelValue", value);
  scheduleFetch(value);
}

function handleFocus(): void {
  if (trimmedQuery.value.length >= 1) {
    if (suggestions.value.length > 0 || hasSearched.value) {
      isOpen.value = true;
    } else {
      scheduleFetch(props.modelValue, 0);
    }
  }
}

function scheduleFetch(query: string, delay = 250): void {
  if (debounceTimer) clearTimeout(debounceTimer);

  const trimmed = query.trim();
  if (trimmed.length < 1) {
    abortController?.abort();
    loading.value = false;
    suggestions.value = [];
    hasSearched.value = false;
    isOpen.value = false;
    highlightedIndex.value = -1;
    return;
  }

  debounceTimer = setTimeout(() => {
    void executeFetch(trimmed);
  }, delay);
}

async function executeFetch(query: string): Promise<void> {
  abortController?.abort();
  abortController = new AbortController();
  loading.value = true;
  isOpen.value = true;
  highlightedIndex.value = -1;

  try {
    const result = await fetchSearchSuggestions(props.mode, query, abortController.signal, 6);
    suggestions.value = result;
    hasSearched.value = true;
  } catch (err: unknown) {
    const errorObj = err as { code?: string; name?: string } | null;
    if (
      errorObj?.code === "ERR_CANCELED" ||
      errorObj?.name === "CanceledError" ||
      errorObj?.name === "AbortError"
    ) {
      return;
    }
    suggestions.value = [];
    hasSearched.value = true;
  } finally {
    loading.value = false;
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (!isOpen.value && event.key !== "Escape" && event.key !== "Tab") {
    if (trimmedQuery.value.length >= 1) {
      isOpen.value = true;
    }
  }

  switch (event.key) {
    case "ArrowDown": {
      event.preventDefault();
      if (!suggestions.value.length) return;
      highlightedIndex.value = (highlightedIndex.value + 1) % suggestions.value.length;
      scrollToHighlighted();
      break;
    }
    case "ArrowUp": {
      event.preventDefault();
      if (!suggestions.value.length) return;
      highlightedIndex.value =
        highlightedIndex.value <= 0
          ? suggestions.value.length - 1
          : highlightedIndex.value - 1;
      scrollToHighlighted();
      break;
    }
    case "Enter": {
      event.preventDefault();
      if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
        selectItem(suggestions.value[highlightedIndex.value]);
      } else {
        submitDirectSearch();
      }
      break;
    }
    case "Escape": {
      isOpen.value = false;
      highlightedIndex.value = -1;
      break;
    }
  }
}

function scrollToHighlighted(): void {
  void nextTick(() => {
    const element = document.getElementById(`${props.id}-suggest-${highlightedIndex.value}`);
    element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

function selectItem(item: SearchSuggestionItem): void {
  isOpen.value = false;
  emit("select", item);

  if (props.navigateOnSelect && item.url) {
    void router.push(item.url);
  } else {
    const queryValue = item.code || item.title;
    emit("update:modelValue", queryValue);
    emit("search", queryValue);
  }
}

function fillSearchQuery(item: SearchSuggestionItem): void {
  const queryValue = item.code || item.title;
  emit("update:modelValue", queryValue);
  emit("search", queryValue);
  isOpen.value = false;
  inputRef.value?.focus();
}

function submitDirectSearch(): void {
  isOpen.value = false;
  emit("search", trimmedQuery.value);
}

function handleClickOutside(event: MouseEvent): void {
  const target = event.target as Node;
  if (wrapperRef.value && !wrapperRef.value.contains(target)) {
    isOpen.value = false;
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (!val.trim()) {
      suggestions.value = [];
      hasSearched.value = false;
      isOpen.value = false;
    }
  },
);

onMounted(() => {
  document.addEventListener("click", handleClickOutside, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside, true);
  if (debounceTimer) clearTimeout(debounceTimer);
  abortController?.abort();
});
</script>

<style scoped>
.search-suggest-box {
  width: 100%;
}

.search-suggest-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1050;
  max-height: 380px;
  overflow-y: auto;
  border-radius: 0.5rem;
  background-color: var(--phoenix-body-bg, #fff);
}

.suggest-item {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  text-decoration: none;
  border-radius: 0.375rem;
  margin: 0.125rem 0.375rem;
}

.suggest-item:hover,
.suggest-item.is-highlighted,
.suggest-item.active {
  background-color: var(--phoenix-dropdown-link-hover-bg, rgba(var(--phoenix-primary-rgb), 0.08));
}

.suggest-item__thumb {
  width: 36px;
  height: 36px;
}

.suggest-item__placeholder {
  width: 36px;
  height: 36px;
  background-color: var(--phoenix-secondary-bg-subtle, rgba(0, 0, 0, 0.05));
}

.pointer-events-none {
  pointer-events: none;
}
</style>
