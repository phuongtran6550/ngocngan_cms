<template>
  <DrawerPanel :open="open" title="Đổi mật khẩu" @close="$emit('close')">
    <p class="text-body-tertiary mb-4">Mật khẩu mới cần có ít nhất 6 ký tự.</p>
    <ChangePasswordForm @changed="$emit('changed')" />
  </DrawerPanel>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DrawerPanel from "@/components/overlay/DrawerPanel.vue";
import ChangePasswordForm from "@/views/Account/components/ChangePasswordForm.vue";

export default defineComponent({
  name: "ChangePasswordDrawer",
  components: { ChangePasswordForm, DrawerPanel },
  props: { open: { type: Boolean, required: true } },
  emits: ["close", "changed"],
});
</script>
