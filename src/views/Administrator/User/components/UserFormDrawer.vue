<template>
  <DrawerPanel :open="open" :title="editing ? 'Cập nhật nhân sự' : 'Thêm nhân sự'" @close="$emit('close')">
    <div v-if="error" class="alert alert-subtle-danger" role="alert">{{ error }}</div>
    <FormLayout
      :definition="definition"
      :model-value="modelValue"
      :submitting="submitting"
      :submit-label="editing ? 'Cập nhật' : 'Thêm nhân sự'"
      @update:model-value="$emit('update:modelValue', $event)"
      @submit="$emit('submit', $event)"
      @cancel="$emit('close')"
    />
  </DrawerPanel>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import FormLayout from "@/components/FormLayout/index.vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import { createUserFormDefinition } from "@/views/Administrator/User/config";
import type { UserFormModel, UserRoleOption } from "@/views/Administrator/User/types";
import type { FormDefinition } from "@/config/resource";

export default defineComponent({
  name: "UserFormDrawer",
  components: { DrawerPanel, FormLayout },
  props: {
    open: Boolean,
    editing: Boolean,
    modelValue: { type: Object as PropType<UserFormModel>, required: true },
    roleOptions: { type: Array as PropType<UserRoleOption[]>, default: () => [] },
    roleOptionsLoading: Boolean,
    submitting: Boolean,
    error: { type: String, default: "" },
  },
  emits: ["close", "update:modelValue", "submit"],
  computed: {
    definition(): FormDefinition {
      return createUserFormDefinition({
        editing: this.editing,
        roleOptions: this.roleOptions,
        loading: this.roleOptionsLoading,
      });
    },
  },
});
</script>
