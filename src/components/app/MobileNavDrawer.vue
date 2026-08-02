<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="offcanvas offcanvas-start show"
      data-testid="mobile-nav-drawer"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-label="Menu điều hướng"
    >
      <div class="offcanvas-header">
        <RouterLink to="/dashboard" class="navbar-brand d-flex align-items-center" @click="$emit('close')">
          <BrandLogo kind="mark" show-name />
        </RouterLink>
        <button
          type="button"
          class="btn-close"
          data-testid="mobile-nav-close"
          aria-label="Đóng menu"
          @click="$emit('close')"
        />
      </div>
      <div class="offcanvas-body p-0">
        <AppSidebar mobile @close-mobile="$emit('close')" />
      </div>
    </div>
    <button
      v-if="open"
      type="button"
      class="offcanvas-backdrop fade show"
      aria-label="Đóng menu"
      @click="$emit('close')"
    />
  </Teleport>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BrandLogo from "@/components/app/BrandLogo.vue";
import AppSidebar from "@/components/app/Sidebar.vue";
import { createOverlayBehavior } from "@/components/overlay/behavior";

export default defineComponent({
  name: "MobileNavDrawer",
  components: { AppSidebar, BrandLogo },
  props: { open: { type: Boolean, required: true } },
  emits: ["close"],
  data() {
    return { overlay: createOverlayBehavior(() => this.$emit("close")) };
  },
  watch: {
    open: {
      immediate: true,
      handler(open: boolean) {
        this.overlay.sync(open);
      },
    },
  },
  beforeUnmount() {
    this.overlay.dispose();
  },
});
</script>
