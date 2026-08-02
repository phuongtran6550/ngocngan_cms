<template>
  <section>
    <PageHeader title="Hồ sơ cá nhân" description="Thông tin tài khoản đang đăng nhập." />
    <article class="card">
      <div class="card-header bg-transparent border-bottom">
        <div class="d-flex align-items-center justify-content-between gap-3">
          <div>
            <h5 class="mb-1 text-body-emphasis">Thông tin tài khoản</h5>
            <p class="mb-0 fs-9 text-body-tertiary">Thông tin dùng để nhận diện phiên đăng nhập hiện tại.</p>
          </div>
          <AppAvatar size="xl" :src="auth.user?.avatar" />
        </div>
      </div>
      <div class="card-body">
        <dl class="row gy-4 mb-0">
          <template v-for="field in profileFields" :key="field.label">
            <dt class="col-12 col-sm-4 mb-0 fs-9 fw-semibold text-body-tertiary">{{ field.label }}</dt>
            <dd class="col-12 col-sm-8 mb-0 fw-semibold text-body-highlight">{{ field.value }}</dd>
          </template>
        </dl>
      </div>
    </article>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import AppAvatar from "@/components/ui/AppAvatar.vue";
import { authenStore } from "@/stores/app-authen";
import { accountRoleLabel } from "@/utils/user-display";

export default defineComponent({
  name: "ProfilePage",
  components: { AppAvatar, PageHeader },
  computed: {
    auth() {
      return authenStore();
    },
    roleLabel(): string {
      return accountRoleLabel(this.auth.user);
    },
    profileFields(): Array<{ label: string; value: string }> {
      return [
        { label: "Họ và tên", value: this.auth.displayName },
        { label: "Tên đăng nhập", value: this.auth.user?.username || "—" },
        { label: "Vai trò", value: this.roleLabel },
      ];
    },
  },
});
</script>
