<template>
  <section class="page-shell goods-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Quản lý hàng nhập</h1>
        <p class="muted">Theo dõi nguồn hàng và chi phí nhập</p>
      </div>
      <RouterLink class="btn btn-primary page-actions" to="/warehoused-goods/create">
        <Icon icon="heroicons-outline:plus" />
        Thêm
      </RouterLink>
    </div>

    <div class="toolbar toolbar-surface">
      <form class="filter-grid" @submit.prevent="load(1)">
        <input v-model.trim="query" class="field" placeholder="Tìm tên hoặc SDT">
        <button class="btn btn-light btn-icon search-submit" title="Tìm kiếm" type="submit">
          <Icon icon="heroicons-outline:magnifying-glass" />
          <span class="search-submit__label">Tìm kiếm</span>
        </button>
      </form>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="page.items.length" class="grid-cards">
      <article v-for="item in page.items" :key="item.id" class="card">
        <RouterLink :to="`/warehoused-goods/${item.id}`" class="card-image">
          <img :src="assetUrl(item.thumbnail)" alt="">
        </RouterLink>
        <div class="card-body">
          <h2 class="card-title">{{ item.name || 'Chưa có tên' }}</h2>
          <div class="card-meta">
            <span>SDT: {{ item.phone || '-' }}</span>
            <span>Thành tiền: {{ money(item.price) }}</span>
            <span>{{ date(item.createdAt) }}</span>
          </div>
          <div class="card-actions">
            <RouterLink class="btn btn-light" :to="`/warehoused-goods/${item.id}`">Chi tiết</RouterLink>
            <button v-if="auth.can('warehouse.delete')" class="btn btn-danger" type="button" @click="askDelete(item)">Xóa</button>
          </div>
        </div>
      </article>
    </div>
    <div v-else class="empty-state">Chưa có hàng nhập phù hợp</div>

    <PaginationBar :page="page.page" :total-pages="page.totalPages" @change="load" />
    <ConfirmModal
      :open="Boolean(deleting)"
      title="Xóa hàng nhập"
      message="Bạn muốn xóa hàng nhập này?"
      confirm-text="Xóa"
      @cancel="deleting = null"
      @confirm="remove"
    />
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import Icon from '@/components/Icon';
import PaginationBar from '@/components/common/PaginationBar.vue';
import { api, apiMessage, assetUrl } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const query = ref(String(route.query.query || ''));
const error = ref('');
const deleting = ref(null);
const page = reactive({ items: [], page: 1, totalPages: 0 });

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' vnđ';
}
function date(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '';
}
async function load(nextPage = page.page) {
  const { data } = await api.get('/warehoused-goods', { params: { query: query.value, page: nextPage } });
  Object.assign(page, data);
}
function askDelete(item) {
  deleting.value = item;
}
async function remove() {
  try {
    await api.delete(`/warehoused-goods/${deleting.value.id}`);
    deleting.value = null;
    await load();
  } catch (err) {
    error.value = apiMessage(err);
  }
}
onMounted(() => load(1).catch((err) => { error.value = apiMessage(err); }));
</script>
