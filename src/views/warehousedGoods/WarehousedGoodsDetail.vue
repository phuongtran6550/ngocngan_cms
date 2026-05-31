<template>
  <section v-if="item" class="page-shell detail-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Hàng nhập #{{ item.id }}</h1>
        <p class="muted">{{ date(item.createdAt) }}</p>
      </div>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div class="detail-layout">
      <figure class="detail-media">
        <img class="detail-image" :src="assetUrl(item.thumbnail)" alt="" @click="preview = assetUrl(item.thumbnail)">
      </figure>
      <div class="panel panel-body detail-panel">
        <h2>Thông tin hàng nhập</h2>
        <div class="record-list">
          <div class="list-row"><span>Tên</span><strong>{{ item.name || '-' }}</strong></div>
          <div class="list-row"><span>SDT</span><strong>{{ item.phone || '-' }}</strong></div>
          <div class="list-row"><span>Loại</span><strong>Hàng nhập</strong></div>
          <div class="list-row"><span>Thành tiền</span><strong>{{ money(item.price) }}</strong></div>
        </div>
      </div>
    </div>
    <ImagePreview :src="preview" @close="preview = ''" />
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import ImagePreview from '@/components/common/ImagePreview.vue';
import { api, apiMessage, assetUrl } from '@/services/api';

const route = useRoute();
const item = ref(null);
const error = ref('');
const preview = ref('');

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' vnđ';
}
function date(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '';
}
onMounted(async () => {
  try {
    const { data } = await api.get(`/warehoused-goods/${route.params.id}`);
    item.value = data.item;
  } catch (err) {
    error.value = apiMessage(err);
  }
});
</script>
