<template>
  <main id="top" class="main">
    <div class="container">
      <div class="row flex-center min-vh-100 py-5">
        <div class="col-sm-10 col-md-8 col-lg-5 col-xl-5 col-xxl-3">
          <RouterLink class="d-flex flex-center text-decoration-none mb-4" :to="{ name: 'login' }">
            <BrandLogo kind="mark" class="cms-login-brand" />
          </RouterLink>

          <div class="text-center mb-7">
            <h3 class="text-body-highlight">Đăng nhập</h3>
            <p class="text-body-tertiary">Truy cập {{ brand.cmsName }}</p>
          </div>

          <div v-if="error" class="alert alert-subtle-danger" role="alert">
            {{ error }}
          </div>

          <form @submit.prevent="submit">
            <div class="mb-3 text-start">
              <label class="form-label" for="username">Tên đăng nhập</label>
              <div class="form-icon-container">
                <input
                  id="username"
                  v-model.trim="form.username"
                  class="form-control form-icon-input"
                  type="text"
                  placeholder="Tên đăng nhập"
                  autocomplete="username"
                  required
                  autofocus
                />
                <AppIcon
                  data-testid="login-username-icon"
                  class="text-body fs-9 form-icon"
                  name="user"
                />
              </div>
            </div>
            <div class="mb-4 text-start">
              <label class="form-label" for="password">Mật khẩu</label>
              <div class="form-icon-container">
                <input
                  id="password"
                  v-model="form.password"
                  class="form-control form-icon-input pe-6"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Mật khẩu"
                  autocomplete="current-password"
                  minlength="6"
                  required
                />
                <AppIcon
                  data-testid="login-password-icon"
                  class="text-body fs-9 form-icon"
                  name="key"
                />
                <button
                  class="btn px-3 py-0 h-100 position-absolute top-0 end-0 fs-7 text-body-tertiary"
                  :class="{ 'show-password': showPassword }"
                  data-password-toggle
                  data-testid="password-visibility-toggle"
                  type="button"
                  :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                >
                  <AppIcon class="show" name="eye" />
                  <AppIcon class="hide" name="eye-off" />
                </button>
              </div>
            </div>
            <button class="btn btn-primary w-100 mb-3" type="submit" :disabled="auth.isLoading">
              <span v-if="auth.isLoading" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {{ auth.isLoading ? "Đang đăng nhập..." : "Đăng nhập" }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import BrandLogo from "@/components/app/BrandLogo.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { brand } from "@/config/brand";
import { internalRedirectTarget, visibleNavigation } from "@/config/navigation";
import { apiError } from "@/request";
import { authenStore } from "@/stores/app-authen";

export default defineComponent({
  name: "LoginPage",
  components: { AppIcon, BrandLogo },
  data() {
    return {
      brand,
      form: { username: "", password: "" },
      error: "",
      showPassword: false,
    };
  },
  computed: {
    auth() {
      return authenStore();
    },
  },
  methods: {
    async submit(): Promise<void> {
      this.error = "";
      try {
        await this.auth.login(this.form);
        const target = visibleNavigation(this.auth.permissions, this.auth.user?.role)[0]?.path || "/profile";
        await this.$router.replace(internalRedirectTarget(this.$route.query.redirect) || target);
      } catch (error) {
        this.error = apiError(error).message;
      }
    },
  },
});
</script>
