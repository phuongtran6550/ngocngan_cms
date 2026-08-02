<template>
  <section>
    <div class="row justify-content-center">
      <div class="col-12 col-md-9 col-lg-7 col-xl-6">
        <div class="card border shadow-none text-center my-5">
          <div class="card-body p-4 p-md-5">
            <BrandLogo kind="mark" class="cms-status-brand" />
            <p class="text-uppercase text-primary fw-bold fs-10 mt-4 mb-2">{{ brand.cmsName }}</p>
            <h1 class="fs-5 mb-3">Không có quyền truy cập</h1>
            <p class="text-body-tertiary mb-4">
              Tài khoản hiện tại chưa được cấp quyền cho chức năng này. Nếu đây là nhầm lẫn, vui lòng liên hệ quản trị viên để cập nhật vai trò.
            </p>
            <RouterLink class="btn btn-primary" to="/profile">Về hồ sơ cá nhân</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BrandLogo from "@/components/app/BrandLogo.vue";
import { brand } from "@/config/brand";
import { RouterLink } from "vue-router";

export default defineComponent({
  name: "ForbiddenPage",
  components: { BrandLogo, RouterLink },
  data() {
    return { brand };
  },
});
</script>
