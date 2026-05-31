<template>
  <section class="page-shell orders-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Quản lý đơn hàng</h1>
        <p class="muted">Theo dõi đơn bán, đổi trả và lịch sử giao dịch</p>
      </div>
      <RouterLink class="btn btn-primary page-actions" to="/orders/create">
        <Icon icon="heroicons-outline:plus" />
        Thêm
      </RouterLink>
    </div>

    <div class="toolbar toolbar-surface">
      <form class="filter-grid" @submit.prevent="load(1)">
        <input v-model.trim="filters.query" class="field" placeholder="Tìm tên hoặc SDT">
        <select v-model="filters.type" class="select">
          <option value="">Tất cả</option>
          <option value="1">Hàng bán</option>
          <option value="2">Đổi trả</option>
        </select>
        <button class="btn btn-light btn-icon search-submit" title="Tìm kiếm" type="submit">
          <Icon icon="heroicons-outline:magnifying-glass" />
          <span class="search-submit__label">Tìm kiếm</span>
        </button>
      </form>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="page.items.length" class="grid-cards">
      <article v-for="order in page.items" :key="order.id" class="card">
        <RouterLink :to="`/orders/${order.id}`" class="card-image">
          <span :class="['badge', order.sell ? 'badge-green' : 'badge-yellow']">{{ order.sell ? 'Hàng bán' : 'Đổi trả' }}</span>
          <span v-if="order.isRemoved" class="badge badge-red">Chờ xoá</span>
          <img :src="assetUrl(order.thumbnail)" alt="">
        </RouterLink>
        <div class="card-body">
          <h2 class="card-title">{{ order.name || 'Chưa có tên' }}</h2>
          <div class="card-meta">
            <span>SDT: {{ order.phone || '-' }}</span>
            <span>Thành tiền: {{ money(order.price) }}</span>
            <span>{{ date(order.createdAt) }}</span>
          </div>
          <div class="card-actions">
            <RouterLink class="btn btn-light" :to="`/orders/${order.id}`">Chi tiết</RouterLink>
            <button v-if="auth.can('orders.delete')" class="btn btn-danger" type="button" @click="askDelete(order)">Xóa</button>
          </div>
        </div>
      </article>
    </div>
    <div v-else class="empty-state">Chưa có đơn hàng phù hợp</div>

    <PaginationBar :page="page.page" :total-pages="page.totalPages" @change="load" />
    <ConfirmModal
      :open="Boolean(deleting)"
      title="Xóa đơn hàng"
      :message="`Bạn muốn xóa đơn #${deleting?.id || ''}?`"
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
const error = ref('');
const deleting = ref(null);
const filters = reactive({ query: String(route.query.query || ''), type: '' });
const page = reactive({ items: [], page: 1, totalPages: 0 });

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' vnđ';
}

function date(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '';
}

async function load(nextPage = page.page) {
  error.value = '';
  try {
    const { data } = await api.get('/orders', { params: { ...filters, page: nextPage } });
    Object.assign(page, data);
  } catch (err) {
    error.value = apiMessage(err);
  }
}

function askDelete(order) {
  deleting.value = order;
}

async function remove() {
  await api.delete(`/orders/${deleting.value.id}`);
  deleting.value = null;
  await load();
}

onMounted(() => load(1));
</script>
