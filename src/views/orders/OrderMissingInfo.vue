<template>
  <section class="page-shell missing-orders-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Đơn hàng chưa thông tin</h1>
        <p class="muted">Các đơn đã chụp ảnh nhanh cần bổ sung dữ liệu</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div v-if="page.items.length" class="grid-cards">
      <article v-for="order in page.items" :key="order.id" class="card">
        <div class="card-image" role="button" tabindex="0" @click="preview = assetUrl(order.thumbnail)" @keydown.enter.prevent="preview = assetUrl(order.thumbnail)" @keydown.space.prevent="preview = assetUrl(order.thumbnail)">
          <span :class="['badge', order.sell ? 'badge-green' : 'badge-yellow']">{{ order.sell ? 'Hàng bán' : 'Đổi trả' }}</span>
          <img :src="assetUrl(order.thumbnail)" alt="">
          <span class="image-zoom-cue">Phóng to</span>
        </div>
        <div class="card-body">
          <h2 class="card-title">{{ order.name || 'Thiếu tên' }}</h2>
          <div class="card-meta">
            <span>SDT: {{ order.phone || 'Thiếu SDT' }}</span>
            <span>Giá: {{ order.price ? money(order.price) : 'Thiếu giá tiền' }}</span>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary" type="button" @click="editing = { ...order, price: order.price || '' }">Bổ sung</button>
            <button v-if="auth.can('orders.delete')" class="btn btn-danger" type="button" @click="askDelete(order)">Xóa</button>
          </div>
        </div>
      </article>
    </div>
    <div v-else class="empty-state">Không còn đơn cần bổ sung thông tin</div>

    <PaginationBar :page="page.page" :total-pages="page.totalPages" @change="load" />
    <ImagePreview :src="preview" @close="preview = ''" />

    <div v-if="editing" class="modal-backdrop">
      <form class="modal form-grid form-panel" @submit.prevent="save">
        <h3>Bổ sung đơn #{{ editing.id }}</h3>
        <input v-model.trim="editing.name" class="field" placeholder="Tên">
        <input v-model.trim="editing.phone" class="field" placeholder="Số điện thoại">
        <input v-model.trim="editing.price" class="field" placeholder="Tổng thành tiền" inputmode="numeric">
        <div class="card-actions">
          <button class="btn btn-primary" type="submit">Lưu</button>
          <button class="btn btn-light" type="button" @click="editing = null">Đóng</button>
        </div>
      </form>
    </div>

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
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import PaginationBar from '@/components/common/PaginationBar.vue';
import { api, apiMessage, assetUrl } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const error = ref('');
const success = ref('');
const editing = ref(null);
const deleting = ref(null);
const preview = ref('');
const page = reactive({ items: [], page: 1, totalPages: 0 });

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' vnđ';
}

async function load(nextPage = page.page) {
  const { data } = await api.get('/orders/missing-info', { params: { page: nextPage } });
  Object.assign(page, data);
}

async function save() {
  error.value = '';
  success.value = '';
  try {
    await api.patch(`/orders/${editing.value.id}`, {
      name: editing.value.name,
      phone: editing.value.phone,
      price: editing.value.price
    });
    editing.value = null;
    success.value = 'Cập nhật đơn hàng thành công';
    await load(1);
  } catch (err) {
    error.value = apiMessage(err);
  }
}

function askDelete(order) {
  deleting.value = order;
}

async function remove() {
  error.value = '';
  success.value = '';
  try {
    await api.delete(`/orders/${deleting.value.id}`);
    deleting.value = null;
    success.value = 'Xóa đơn hàng thành công';
    await load(page.page);
  } catch (err) {
    error.value = apiMessage(err);
  }
}

onMounted(() => load(1).catch((err) => { error.value = apiMessage(err); }));
</script>
