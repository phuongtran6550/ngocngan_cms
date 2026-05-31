<template>
  <section class="page-shell customer-page">
    <div class="page-head">
      <div class="page-title">
        <h1>{{ title }}</h1>
        <p class="muted">Tổng hợp giao dịch theo số điện thoại</p>
      </div>
    </div>
    <form class="toolbar toolbar-surface" @submit.prevent="load(1)">
      <div class="filter-grid">
        <input v-model.trim="query" class="field" placeholder="Tìm tên hoặc SDT">
        <span></span>
        <button class="btn btn-light btn-icon" title="Tìm kiếm" type="submit">
          <Icon icon="heroicons-outline:magnifying-glass" />
        </button>
      </div>
    </form>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="page.items.length" class="record-list">
      <RouterLink v-for="item in page.items" :key="item.id" class="list-row" :to="`/orders?query=${item.phone}`">
        <div>
          <strong>{{ item.name || '-' }}</strong>
          <div class="muted">{{ item.phone || '-' }}</div>
        </div>
        <div style="text-align: right;">
          <div class="money">Đã mua: {{ money(item.price) }}</div>
          <div class="muted">Đã bán: {{ money(item.priceReturn) }}</div>
        </div>
      </RouterLink>
    </div>
    <div v-else class="empty-state">Chưa có dữ liệu phù hợp</div>
    <PaginationBar :page="page.page" :total-pages="page.totalPages" @change="load" />
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import Icon from '@/components/Icon';
import PaginationBar from '@/components/common/PaginationBar.vue';
import { api, apiMessage } from '@/services/api';

const props = defineProps({
  title: { type: String, required: true },
  endpoint: { type: String, required: true }
});

const query = ref('');
const error = ref('');
const page = reactive({ items: [], page: 1, totalPages: 0 });

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

async function load(nextPage = page.page) {
  error.value = '';
  try {
    const { data } = await api.get(props.endpoint, { params: { query: query.value, page: nextPage } });
    Object.assign(page, data);
  } catch (err) {
    error.value = apiMessage(err);
  }
}

onMounted(() => load(1));
</script>
