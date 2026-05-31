<template>
  <section class="page-shell goods-create-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Thêm hàng nhập</h1>
        <p class="muted">Hàng nhập được lưu kèm hình ảnh</p>
      </div>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <form class="panel panel-body form-grid form-panel" @submit.prevent="submit">
      <div class="form-row">
        <label>Hình ảnh</label>
        <input class="field" type="file" accept="image/*" capture="environment" @change="setFile">
      </div>
      <div class="form-row">
        <label>Tên</label>
        <input v-model.trim="form.name" class="field">
      </div>
      <div class="form-row">
        <label>Số điện thoại</label>
        <input v-model.trim="form.phone" class="field" inputmode="tel">
      </div>
      <div class="form-row">
        <label>Tổng thành tiền</label>
        <input v-model.trim="form.price" class="field" inputmode="numeric">
      </div>
      <div class="card-actions">
        <button class="btn btn-primary" type="submit" :disabled="loading">{{ loading ? 'Đang lưu' : 'Tạo mới' }}</button>
        <button class="btn btn-light" type="button" @click="reset">Làm mới</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { api, apiMessage } from '@/services/api';

const file = ref(null);
const error = ref('');
const success = ref('');
const loading = ref(false);
const form = reactive({ name: '', phone: '', price: '' });

function setFile(event) {
  file.value = event.target.files?.[0] || null;
}
function reset() {
  file.value = null;
  form.name = '';
  form.phone = '';
  form.price = '';
}
async function submit() {
  const body = new FormData();
  if (file.value) body.append('thumbnail', file.value);
  body.append('name', form.name);
  body.append('phone', form.phone);
  body.append('price', form.price);
  error.value = '';
  success.value = '';
  loading.value = true;
  try {
    await api.post('/warehoused-goods', body);
    success.value = 'Thêm hàng nhập thành công';
    reset();
  } catch (err) {
    error.value = apiMessage(err);
  } finally {
    loading.value = false;
  }
}
</script>
