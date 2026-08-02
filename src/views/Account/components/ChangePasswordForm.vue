<template>
  <div>
    <div v-if="message" class="alert alert-subtle-success" role="status">{{ message }}</div>
    <div v-if="error" class="alert alert-subtle-danger" role="alert">{{ error }}</div>
    <form data-testid="change-password-form" @submit.prevent="submit">
      <div class="mb-3">
        <label class="form-label" for="new-password">Mật khẩu mới</label>
        <input
          id="new-password"
          v-model="password"
          class="form-control"
          data-testid="change-password-new"
          type="password"
          autocomplete="new-password"
          minlength="6"
          required
        />
      </div>
      <div class="mb-4">
        <label class="form-label" for="confirm-password">Xác nhận mật khẩu</label>
        <input
          id="confirm-password"
          v-model="confirmation"
          class="form-control"
          data-testid="change-password-confirm"
          type="password"
          autocomplete="new-password"
          minlength="6"
          required
        />
      </div>
      <button class="btn btn-primary" type="submit" :disabled="submitting">
        <span v-if="submitting" class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
        {{ submitting ? "Đang cập nhật..." : submitLabel }}
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { apiError } from "@/request";
import { authenStore } from "@/stores/app-authen";

export default defineComponent({
  name: "ChangePasswordForm",
  props: {
    submitLabel: { type: String, default: "Cập nhật mật khẩu" },
  },
  emits: ["changed"],
  data() {
    return {
      password: "",
      confirmation: "",
      submitting: false,
      error: "",
      message: "",
    };
  },
  methods: {
    async submit(): Promise<void> {
      this.error = "";
      this.message = "";
      if (this.password !== this.confirmation) {
        this.error = "Mật khẩu xác nhận không khớp";
        return;
      }
      this.submitting = true;
      try {
        await authenStore().changePassword(this.password);
        this.password = "";
        this.confirmation = "";
        this.message = "Mật khẩu đã được cập nhật";
        this.$emit("changed");
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.submitting = false;
      }
    },
  },
});
</script>
