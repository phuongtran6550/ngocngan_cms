import { ref, watch, type Ref } from "vue";

export type ListViewMode = "table" | "grid";

export interface ListViewModeController {
  setViewMode(mode: ListViewMode): void;
  viewMode: Ref<ListViewMode>;
}

const storagePrefix = "ngoc-chau:list-view:";
const mobileMediaQuery = "(max-width: 767.98px)";

function isListViewMode(value: unknown): value is ListViewMode {
  return value === "table" || value === "grid";
}

function storageKey(resourceKey: string): string {
  return `${storagePrefix}${resourceKey}`;
}

function responsiveDefault(): ListViewMode {
  try {
    return typeof window !== "undefined" &&
      window.matchMedia(mobileMediaQuery).matches
      ? "grid"
      : "table";
  } catch {
    return "table";
  }
}

function savedViewMode(resourceKey: string): ListViewMode | null {
  try {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(storageKey(resourceKey));
    return isListViewMode(value) ? value : null;
  } catch {
    return null;
  }
}

export function useListViewMode(
  resourceKey: Ref<string>,
): ListViewModeController {
  const viewMode = ref<ListViewMode>("table");

  function loadPreference(key: string): void {
    viewMode.value = savedViewMode(key) || responsiveDefault();
  }

  function setViewMode(mode: ListViewMode): void {
    if (!isListViewMode(mode)) return;
    viewMode.value = mode;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey(resourceKey.value), mode);
      }
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }

  watch(resourceKey, loadPreference, { immediate: true });

  return { setViewMode, viewMode };
}
