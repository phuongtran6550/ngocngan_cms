<template>
  <section class="page-shell source-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Quản lý nguồn hàng</h1>
        <p class="muted">Tổng hợp giá trị nhập theo nguồn</p>
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
      <RouterLink v-for="item in page.items" :key="item.id" class="list-row" :to="`/warehoused-goods?query=${item.phone}`">
        <div>
          <strong>{{ item.name || '-' }}</strong>
          <div class="muted">{{ item.phone || '-' }}</div>
        </div>
        <div class="money">{{ money(item.price) }}</div>
      </RouterLink>
    </div>
    <div v-else class="empty-state">Chưa có nguồn hàng phù hợp</div>
    <PaginationBar :page="page.page" :total-pages="page.totalPages" @change="load" />
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import Icon from '@/components/Icon';
import PaginationBar from '@/components/common/PaginationBar.vue';
import { api, apiMessage } from '@/services/api';

const query = ref('');
const error = ref('');
const page = reactive({ items: [], page: 1, totalPages: 0 });

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' vnđ';
}
async function load(nextPage = page.page) {
  try {
    const { data } = await api.get('/source-of-goods', { params: { query: query.value, page: nextPage } });
    Object.assign(page, data);
  } catch (err) {
    error.value = apiMessage(err);
  }
}
onMounted(() => load(1));
</script>
