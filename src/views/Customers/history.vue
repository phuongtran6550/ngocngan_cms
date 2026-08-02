<template><CustomerListView mode="history" /></template>
<script lang="ts">
import { defineComponent } from "vue";
import CustomerListView from "@/views/Customers/components/CustomerListView.vue";
export default defineComponent({ name: "CustomerHistoryPage", components: { CustomerListView } });
</script>
