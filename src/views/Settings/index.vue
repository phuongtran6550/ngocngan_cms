<template>
  <section>
    <PageHeader title="Cài đặt" description="Quản lý giá bạc áp dụng và các kết nối vận hành của hệ thống." />
    <div class="d-grid gap-4">
      <SilverPriceSection />
      <ZaloAuthorizationSection />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import SilverPriceSection from "@/views/Settings/components/SilverPriceSection.vue";
import ZaloAuthorizationSection from "@/views/Settings/components/ZaloAuthorizationSection.vue";

export default defineComponent({
  name: "SettingsPage",
  components: { PageHeader, SilverPriceSection, ZaloAuthorizationSection },
});
</script>
