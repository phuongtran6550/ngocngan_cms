<template><CustomerListView mode="current" /></template>
<script lang="ts">
import { defineComponent } from "vue";
import CustomerListView from "@/views/Customers/components/CustomerListView.vue";
export default defineComponent({ name: "CustomerListPage", components: { CustomerListView } });
</script>
