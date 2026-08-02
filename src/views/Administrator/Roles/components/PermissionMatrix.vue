<template>
  <section aria-labelledby="permission-matrix-title">
    <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
      <div>
        <h3 id="permission-matrix-title" class="fs-8 mb-1">Phân quyền</h3>
        <p class="text-body-tertiary fs-10 mb-0">Đã chọn {{ modelValue.length }} / {{ catalog.items.length }} quyền</p>
      </div>
      <div class="flex-grow-1 permission-search">
        <label class="visually-hidden" for="permission-search">Tìm quyền</label>
        <input id="permission-search" v-model.trim="query" type="search" class="form-control form-control-sm" placeholder="Tìm theo tên hoặc mã quyền" />
      </div>
    </div>

    <div v-if="!visibleGroups.length" class="rounded border p-3 text-body-tertiary">Không tìm thấy quyền phù hợp.</div>
    <div v-for="group in visibleGroups" :key="group.name" class="card border shadow-none mb-3">
      <div class="card-header bg-body-highlight d-flex align-items-center justify-content-between gap-2 py-2 px-3">
        <strong class="fs-9">{{ group.name }}</strong>
        <span class="d-flex gap-1">
          <button type="button" class="btn btn-sm btn-link" :data-testid="`permission-select-${group.name}`" :disabled="disabled" @click="selectGroup(group.permissions)">Chọn nhóm</button>
          <button type="button" class="btn btn-sm btn-link text-body-tertiary" :data-testid="`permission-clear-${group.name}`" :disabled="disabled" @click="clearGroup(group.permissions)">Bỏ nhóm</button>
        </span>
      </div>
      <div class="card-body p-3">
        <div class="row g-2">
          <div v-for="permission in group.items" :key="permission.key" class="col-12 col-lg-6">
            <label class="form-check d-flex align-items-start gap-2 rounded p-2 permission-option" :for="inputId(permission.key)">
              <input
                :id="inputId(permission.key)"
                class="form-check-input mt-1"
                type="checkbox"
                :checked="modelValue.includes(permission.key)"
                :disabled="disabled"
                @change="toggle(permission.key, ($event.target as HTMLInputElement).checked)"
              />
              <span><span class="d-block fw-semibold fs-9">{{ permission.label }}</span><small class="text-body-tertiary">{{ permission.key }}</small></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { PermissionCatalog, PermissionItem } from "@/views/Administrator/Roles/types";

interface VisibleGroup {
  name: string;
  permissions: string[];
  items: PermissionItem[];
}

export default defineComponent({
  name: "PermissionMatrix",
  props: {
    catalog: { type: Object as PropType<PermissionCatalog>, required: true },
    modelValue: { type: Array as PropType<string[]>, default: () => [] },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  data() { return { query: "" }; },
  computed: {
    visibleGroups(): VisibleGroup[] {
      const query = this.query.toLocaleLowerCase("vi");
      return this.catalog.groups.map((group) => {
        const items = this.catalog.items.filter((permission) => {
          if (!group.permissions.includes(permission.key)) return false;
          if (!query) return true;
          return [permission.label, permission.key, permission.group]
            .some((value) => value.toLocaleLowerCase("vi").includes(query));
        });
        return { ...group, items };
      }).filter((group) => group.items.length > 0);
    },
  },
  methods: {
    inputId(key: string): string { return `permission-${key.replace(/[^a-z0-9_-]/gi, "-")}`; },
    update(values: string[]): void {
      const allowed = new Set(this.catalog.items.map(({ key }) => key));
      this.$emit("update:modelValue", [...new Set(values)].filter((key) => allowed.has(key)));
    },
    toggle(key: string, checked: boolean): void {
      this.update(checked ? [...this.modelValue, key] : this.modelValue.filter((value) => value !== key));
    },
    selectGroup(keys: string[]): void { this.update([...this.modelValue, ...keys]); },
    clearGroup(keys: string[]): void {
      const removed = new Set(keys);
      this.update(this.modelValue.filter((key) => !removed.has(key)));
    },
  },
});
</script>

<style scoped>
.permission-search { max-width: 22rem; min-width: 14rem; }
.permission-option { cursor: pointer; }
.permission-option:hover { background: var(--phoenix-emphasis-bg); }
</style>
