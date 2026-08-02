<template>
  <footer class="footer position-absolute">
    <div class="row g-0 justify-content-between align-items-center h-100">
      <div class="col-12 col-sm-auto text-center">
        <p class="mb-0 mt-2 mt-sm-0 text-body-tertiary fs-10">
          {{ brand.cmsName }} · Hệ thống quản trị
        </p>
      </div>
      <div class="col-12 col-sm-auto text-center">
        <p class="mb-0 text-body-tertiary text-opacity-85 fs-10">v2</p>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { brand } from "@/config/brand";

export default defineComponent({
  name: "AppFooter",
  data() {
    return { brand };
  },
});
</script>
