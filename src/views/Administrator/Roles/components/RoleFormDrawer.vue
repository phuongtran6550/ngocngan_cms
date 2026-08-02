<template>
  <DrawerPanel :open="open" :title="editing ? 'Cập nhật vai trò' : 'Thêm vai trò'" @close="$emit('close')">
    <div v-if="error" class="alert alert-subtle-danger" role="alert">{{ error }}</div>
    <form @submit.prevent="$emit('submit', modelValue)">
      <div class="mb-3">
        <label class="form-label" for="role-name">Tên vai trò <span class="text-danger">*</span></label>
        <input id="role-name" class="form-control" name="name" required maxlength="120" :value="modelValue.name" @input="patch('name', ($event.target as HTMLInputElement).value)" />
      </div>
      <div class="mb-4">
        <label class="form-label" for="role-description">Mô tả</label>
        <textarea id="role-description" class="form-control" name="description" rows="3" maxlength="500" :value="modelValue.description" @input="patch('description', ($event.target as HTMLTextAreaElement).value)" />
      </div>
      <div v-if="catalogLoading" class="text-body-tertiary mb-4">Đang tải danh sách quyền...</div>
      <PermissionMatrix v-else :catalog="catalog" :model-value="modelValue.permissions" @update:model-value="patch('permissions', $event)" />
      <div class="d-flex justify-content-end gap-2 pt-3">
        <button type="button" class="btn btn-phoenix-secondary" @click="$emit('close')">Hủy</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting || catalogLoading">{{ submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm vai trò" }}</button>
      </div>
    </form>
  </DrawerPanel>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import PermissionMatrix from "@/views/Administrator/Roles/components/PermissionMatrix.vue";
import type { PermissionCatalog, RoleFormModel } from "@/views/Administrator/Roles/types";

export default defineComponent({
  name: "RoleFormDrawer",
  components: { DrawerPanel, PermissionMatrix },
  props: {
    open: Boolean,
    editing: Boolean,
    modelValue: { type: Object as PropType<RoleFormModel>, required: true },
    catalog: { type: Object as PropType<PermissionCatalog>, required: true },
    catalogLoading: Boolean,
    submitting: Boolean,
    error: { type: String, default: "" },
  },
  emits: ["close", "submit", "update:modelValue"],
  methods: {
    patch(key: keyof RoleFormModel, value: string | string[]): void {
      this.$emit("update:modelValue", { ...this.modelValue, [key]: value });
    },
  },
});
</script>
