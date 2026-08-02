<template>
  <section>
    <PageHeader title="Đổi mật khẩu" description="Mật khẩu mới cần có ít nhất 6 ký tự." />
    <div class="row justify-content-center">
      <div class="col-12 col-xl-8">
        <article class="card">
          <div class="card-header bg-transparent border-bottom">
            <h5 class="mb-0 text-body-emphasis">Cập nhật mật khẩu</h5>
          </div>
          <div class="card-body">
            <ChangePasswordForm />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import ChangePasswordForm from "@/views/Account/components/ChangePasswordForm.vue";

export default defineComponent({
  name: "ChangePasswordPage",
  components: { ChangePasswordForm, PageHeader },
});
</script>
