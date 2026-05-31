<template>
  <section v-if="order" class="page-shell detail-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Đơn hàng #{{ order.id }}</h1>
        <p class="muted">{{ date(order.createdAt) }}</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="detail-layout">
      <figure class="detail-media">
        <img class="detail-image" :src="assetUrl(order.thumbnail)" alt="" @click="preview = assetUrl(order.thumbnail)">
      </figure>

      <div class="panel panel-body detail-panel">
        <h2>Thông tin đơn</h2>
        <div class="record-list">
          <div class="list-row"><span>Tên</span><strong>{{ order.name || '-' }}</strong></div>
          <div class="list-row"><span>SDT</span><strong>{{ order.phone || '-' }}</strong></div>
          <div class="list-row"><span>Loại đơn</span><strong>{{ order.sell ? 'Hàng bán' : 'Đổi trả' }}</strong></div>
          <div class="list-row"><span>Thành tiền</span><strong>{{ money(order.price) }}</strong></div>
        </div>

        <div v-if="order.items?.length" class="table-wrap">
          <table class="table">
            <thead><tr><th>Sản phẩm</th><th>Giá tiền</th></tr></thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.id">
                <td>{{ item.category }}</td>
                <td>{{ money(item.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="detail-actions">
          <button v-if="order.sell" class="btn btn-warning" type="button" @click="markReturned">Đổi trả</button>
          <button v-if="auth.can('orders.delete')" class="btn btn-danger" type="button" @click="deleting = true">Xóa</button>
        </div>
      </div>
    </div>

    <ImagePreview :src="preview" @close="preview = ''" />
    <ConfirmModal
      :open="deleting"
      title="Xóa đơn hàng"
      message="Bạn muốn xóa đơn này?"
      confirm-text="Xóa"
      @cancel="deleting = false"
      @confirm="remove"
    />
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import { api, apiMessage, assetUrl } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const order = ref(null);
const error = ref('');
const preview = ref('');
const deleting = ref(false);

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' vnđ';
}

function date(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '';
}

async function load() {
  try {
    const { data } = await api.get(`/orders/${route.params.id}`);
    order.value = data.order;
  } catch (err) {
    error.value = apiMessage(err);
  }
}

async function markReturned() {
  const { data } = await api.post(`/orders/${order.value.id}/mark-returned`);
  order.value = data.order;
}

async function remove() {
  await api.delete(`/orders/${order.value.id}`);
  router.push('/orders');
}

onMounted(load);
</script>
