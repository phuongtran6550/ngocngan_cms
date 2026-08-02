<template>
  <section>
    <PageHeader title="Zalo OA" description="Kết nối một Official Account để đồng bộ trạng thái vận hành và các luồng thông báo Zalo." />
    <ZaloAuthorizationSection />
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import ZaloAuthorizationSection from "@/views/Settings/components/ZaloAuthorizationSection.vue";

export default defineComponent({
  name: "ZaloManagementPage",
  components: { PageHeader, ZaloAuthorizationSection },
});
</script>
