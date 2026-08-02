<template>
  <span class="badge badge-phoenix" :class="badgeClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CustomerInfoStatus } from "@/views/Orders/types";

const props = defineProps<{ status: CustomerInfoStatus }>();
const label = computed(() => ({
  complete: "Thông tin đầy đủ",
  ocr_processing: "OCR đang xử lý",
  review_required: "Cần kiểm duyệt",
  manual_required: "Cần nhập thủ công",
})[props.status]);
const badgeClass = computed(() => ({
  complete: "badge-phoenix-success",
  ocr_processing: "badge-phoenix-info",
  review_required: "badge-phoenix-warning",
  manual_required: "badge-phoenix-danger",
})[props.status]);
</script>
