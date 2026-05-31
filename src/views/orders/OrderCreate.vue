<template>
  <section class="page-shell order-create">
    <div class="page-head">
      <div class="page-title">
        <h1>Thêm đơn hàng</h1>
        <p class="muted">Chụp ảnh xong hệ thống sẽ gửi ảnh về server ngay</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <form class="order-create__grid" @submit.prevent="submit('full')">
      <div class="panel panel-body order-create__uploader">
        <input
          ref="fileInput"
          class="order-create__file-input"
          type="file"
          accept="image/*"
          capture="environment"
          @change="handleFileChange"
        >

        <div class="order-create__photo-card">
          <div class="order-create__photo-head">
            <div>
              <label>Hình ảnh đơn hàng</label>
              <small>{{ previewUrl ? 'Bấm vào ảnh để chụp lại' : 'Bấm nút bên dưới để mở camera' }}</small>
            </div>
            <span class="order-create__upload-badge" :class="`is-${uploadState.status}`">{{ uploadBadgeText }}</span>
          </div>

          <button
            class="order-create__photo-action"
            type="button"
            :disabled="loading"
            @click="triggerImagePicker"
            @keydown.enter.prevent="triggerImagePicker"
            @keydown.space.prevent="triggerImagePicker"
          >
            <span v-if="previewUrl" class="order-create__preview">
              <img :src="previewUrl" alt="Ảnh đơn hàng">
            </span>
            <span v-else class="order-create__placeholder">
              <span class="order-create__upload-icon">
                <Icon icon="heroicons-outline:camera" />
              </span>
              <strong>Chụp/chọn ảnh</strong>
              <small>Ảnh sẽ tự gửi sau khi chụp xong</small>
            </span>
            <span v-if="previewUrl" class="order-create__retake-chip">
              <Icon icon="heroicons-outline:camera" />
              {{ photoActionText }}
            </span>
          </button>
          <div v-if="previewUrl" class="order-create__preview-actions">
            <button class="btn btn-light" type="button" @click="zoomPreview = previewUrl">
              <Icon icon="heroicons-outline:magnifying-glass-plus" />
              Phóng to ảnh
            </button>
          </div>
        </div>

        <div v-if="uploadState.status !== 'idle' || uploadInfo" class="order-create__upload-status" :class="`is-${uploadState.status}`">
          <strong>{{ uploadState.message }}</strong>
          <small v-if="uploadInfo">{{ uploadInfo }}</small>
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="order-create__progress">
            <span :style="{ width: `${uploadProgress}%` }"></span>
          </div>
        </div>

        <div v-if="ocrSuggestion.visible" class="order-create__ocr-suggestion">
          <div>
            <strong>Gợi ý từ ảnh</strong>
            <small>Admin kiểm tra lại trước khi lưu đơn</small>
          </div>
          <div class="order-create__ocr-values">
            <span v-if="ocrSuggestion.name">Tên: <strong>{{ ocrSuggestion.name }}</strong></span>
            <span v-if="ocrSuggestion.phone">SĐT: <strong>{{ ocrSuggestion.phone }}</strong></span>
          </div>
          <small v-if="ocrSuggestion.rawText" class="order-create__ocr-raw">{{ ocrSuggestion.rawText }}</small>
          <div class="order-create__ocr-actions">
            <button class="btn btn-primary" type="button" @click="applyDetectedCustomer">Áp dụng gợi ý</button>
            <button class="btn btn-light" type="button" @click="dismissOcrSuggestion">Bỏ qua</button>
          </div>
        </div>

        <div class="order-create__quick-actions">
          <button class="btn btn-primary order-create__save-primary" type="button" :disabled="loading || isUploading || !previewUrl" @click="submit('quick')">
            <Icon icon="heroicons-outline:bolt" />
            {{ loading || isUploading ? 'Đang lưu' : 'Lưu nhanh' }}
          </button>
          <button class="btn btn-light" type="button" @click="reset">
            <Icon icon="heroicons-outline:arrow-path" />
            Làm mới
          </button>
        </div>
      </div>

      <div class="panel panel-body form-grid">
        <div class="form-row">
          <label>Tên khách hàng</label>
          <input v-model.trim="form.name" class="field" autocomplete="name" placeholder="VD: Chị Thảo">
        </div>
        <div class="form-row">
          <label>Số điện thoại</label>
          <input v-model.trim="form.phone" class="field" inputmode="tel" autocomplete="tel" placeholder="VD: 090...">
        </div>
        <div class="form-row">
          <label>Loại đơn</label>
          <div class="segmented">
            <label :class="{ active: form.sell === true }">
              <input v-model="form.sell" type="radio" :value="true">
              Hàng bán
            </label>
            <label :class="{ active: form.sell === false }">
              <input v-model="form.sell" type="radio" :value="false">
              Đổi trả
            </label>
          </div>
        </div>
        <div class="form-row">
          <label>Tổng thành tiền</label>
          <input
            v-model.trim="form.price"
            class="field"
            inputmode="numeric"
            placeholder="VD: 3,400,000"
            @input="formatMoneyInput(form, 'price')"
          >
        </div>

        <div class="form-row form-row-full">
          <label>Danh sách sản phẩm</label>
          <div class="order-create__item-input">
            <select v-model="item.category" class="select">
              <option v-for="category in categories" :key="category">{{ category }}</option>
            </select>
            <input
              v-model.trim="item.price"
              class="field"
              placeholder="Giá"
              inputmode="numeric"
              @input="formatMoneyInput(item, 'price')"
            >
            <button class="btn btn-light" type="button" @click="addItem">Lưu</button>
          </div>
          <div class="list order-create__item-list" v-if="items.length">
            <div v-for="(row, index) in items" :key="index" class="list-row">
              <span>
                <strong>{{ row.category }}</strong>
                <small>{{ money(row.price) }}</small>
              </span>
              <button class="btn btn-light btn-icon" type="button" @click="removeItem(index)">×</button>
            </div>
          </div>
        </div>

        <div class="card-actions form-row-full">
          <button class="btn btn-primary" type="submit" :disabled="loading || isUploading">
            {{ loading || isUploading ? 'Đang lưu' : 'Tạo mới' }}
          </button>
          <button class="btn btn-light" type="button" @click="reset">Làm mới</button>
        </div>
      </div>
    </form>
    <ImagePreview :src="zoomPreview" @close="zoomPreview = ''" />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import Icon from '@/components/Icon';
import ImagePreview from '@/components/common/ImagePreview.vue';
import { api, apiMessage, assetUrl } from '@/services/api';
import { optimizeOrderImage } from '@/services/imageOptimizer';

const error = ref('');
const success = ref('');
const loading = ref(false);
const file = ref(null);
const uploadFile = ref(null);
const uploadOptimized = ref(false);
const fileInput = ref(null);
const previewUrl = ref('');
const zoomPreview = ref('');
const draftOrderId = ref('');
const uploadedThumbnail = ref('');
const uploadProgress = ref(0);
const uploadState = reactive({
  status: 'idle',
  message: 'Chưa chọn ảnh',
  originalSize: 0,
  optimizedSize: 0,
  durationMs: 0
});
const ocrSuggestion = reactive({
  visible: false,
  status: 'idle',
  name: '',
  phone: '',
  rawText: '',
  reviewRequired: false,
  message: ''
});
const form = reactive({ name: '', phone: '', price: '', sell: true });
const item = reactive({ category: 'Nhẫn', price: '' });
const items = ref([]);
const categories = ['Nhẫn', 'Vòng', 'Dây chuyền', 'Bông tai', 'Lắc', 'Mặt dây', 'Khác'];
let uploadToken = 0;
let pendingUpload = null;

const isUploading = computed(() => ['optimizing', 'uploading'].includes(uploadState.status));
const photoActionText = computed(() => (previewUrl.value ? 'Chụp lại' : 'Chụp/chọn ảnh'));
const uploadBadgeText = computed(() => {
  if (uploadState.status === 'optimizing') return 'Đang tối ưu';
  if (uploadState.status === 'uploading') return 'Đang gửi';
  if (uploadState.status === 'reading-text') return 'Đang đọc chữ';
  if (uploadState.status === 'done') return 'Đã gửi';
  if (uploadState.status === 'error') return 'Lỗi gửi';
  return previewUrl.value ? 'Đã chọn' : 'Chưa có ảnh';
});
const uploadInfo = computed(() => {
  if (!uploadState.originalSize) return '';
  const parts = [`${formatBytes(uploadState.originalSize)} → ${formatBytes(uploadState.optimizedSize || uploadState.originalSize)}`];
  if (uploadState.durationMs) parts.push(`${uploadState.durationMs}ms`);
  return parts.join(' · ');
});

function triggerImagePicker() {
  if (loading.value) return;
  fileInput.value?.click();
}

function handleFileChange(event) {
  const selectedFile = event.target.files?.[0];
  if (!selectedFile) return;

  clearOcrSuggestion();
  file.value = selectedFile;
  uploadFile.value = selectedFile;
  uploadOptimized.value = false;
  setPreview(selectedFile);
  void autoUploadImage(selectedFile);
}

function setPreview(selectedFile) {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = selectedFile ? URL.createObjectURL(selectedFile) : '';
}

function formatBytes(value) {
  if (!value) return '0KB';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))}KB`;
  return `${(value / 1024 / 1024).toFixed(1)}MB`;
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatThousands(value) {
  const digits = onlyDigits(value);
  return digits ? Number(digits).toLocaleString('en-US') : '';
}

function formatMoneyInput(target, key) {
  target[key] = formatThousands(target[key]);
}

function money(value) {
  const formatted = formatThousands(value);
  return formatted ? `${formatted} vnđ` : '0 vnđ';
}

function addItem() {
  if (!item.price) return;
  items.value.push({ category: item.category, price: item.price });
  item.price = '';
}

function removeItem(index) {
  items.value.splice(index, 1);
}

function clearOcrSuggestion() {
  ocrSuggestion.visible = false;
  ocrSuggestion.status = 'idle';
  ocrSuggestion.name = '';
  ocrSuggestion.phone = '';
  ocrSuggestion.rawText = '';
  ocrSuggestion.reviewRequired = false;
  ocrSuggestion.message = '';
}

function dismissOcrSuggestion() {
  clearOcrSuggestion();
}

function applyDetectedCustomer() {
  if (ocrSuggestion.name) {
    form.name = ocrSuggestion.name;
  }

  if (ocrSuggestion.phone) {
    form.phone = ocrSuggestion.phone;
  }

  clearOcrSuggestion();
  uploadState.message = 'Đã áp dụng gợi ý từ ảnh';
}

async function readOrderImageText(orderId, token) {
  if (!orderId || token !== uploadToken) return;

  uploadState.status = 'reading-text';
  uploadState.message = 'Đang đọc tên và SĐT từ ảnh';

  try {
    const response = await api.post(`/orders/${orderId}/read-image-text`);
    if (token !== uploadToken) return;

    if (response.data?.order?.thumbnail) {
      uploadedThumbnail.value = response.data.order.thumbnail;
      previewUrl.value = assetUrl(response.data.order.thumbnail) + '?t=' + Date.now();
    }

    const ocr = response.data.ocr || {};
    ocrSuggestion.status = ocr.status || 'not_found';
    ocrSuggestion.name = ocr.name || '';
    ocrSuggestion.phone = ocr.phone || '';
    ocrSuggestion.rawText = ocr.rawText || '';
    ocrSuggestion.reviewRequired = Boolean(ocr.reviewRequired);
    ocrSuggestion.message = ocr.message || '';
    uploadState.status = 'done';

    if (ocrSuggestion.name || ocrSuggestion.phone) {
      ocrSuggestion.visible = true;
      uploadState.message = 'Đã có gợi ý từ ảnh, vui lòng kiểm tra lại';
      success.value = 'Đã có gợi ý từ ảnh, admin kiểm duyệt rồi áp dụng vào đơn';
      return;
    }

    if (ocr.status === 'local_unavailable') {
      uploadState.message = ocr.message || 'Ảnh đã gửi, OCR local chưa khả dụng';
      return;
    }

    uploadState.message = ocr.status === 'not_found'
      ? 'Ảnh đã gửi, chưa đọc được tên/SĐT'
      : 'Ảnh đã gửi về server';
  } catch {
    if (token === uploadToken) {
      uploadState.status = 'done';
      uploadState.message = 'Ảnh đã gửi, đọc chữ chưa thành công';
    }
  }
}

function buildOrderPayload() {
  const payload = {
    sell: form.sell,
    items: items.value.map((row) => ({ category: row.category, price: row.price }))
  };

  if (form.name) payload.name = form.name;
  if (form.phone) payload.phone = form.phone;
  if (form.price) payload.price = form.price;
  return payload;
}

function hasOrderDetails() {
  return Boolean(form.name || form.phone || form.price || items.value.length || form.sell === false);
}

function appendOrderBody(body, imageFile = uploadFile.value || file.value, optimized = uploadOptimized.value) {
  if (imageFile) body.append('thumbnail', imageFile);
  body.append('optimized', String(optimized));
  body.append('name', form.name);
  body.append('phone', form.phone);
  body.append('price', form.price);
  body.append('sell', String(form.sell));
  items.value.forEach((row, index) => {
    body.append(`items[${index}][category]`, row.category);
    body.append(`items[${index}][price]`, row.price);
  });
}

function uploadImageBody(imageFile, optimized) {
  const body = new FormData();
  body.append('thumbnail', imageFile);
  body.append('optimized', String(optimized));
  body.append('sell', String(form.sell));
  return body;
}

function uploadProgressConfig(token) {
  return {
    onUploadProgress(event) {
      if (token !== uploadToken || !event.total) return;
      uploadProgress.value = Math.min(98, 15 + Math.round((event.loaded / event.total) * 83));
    }
  };
}

async function autoUploadImage(selectedFile) {
  const token = ++uploadToken;
  error.value = '';
  success.value = '';
  uploadProgress.value = 3;
  uploadState.status = 'optimizing';
  uploadState.message = 'Đang tối ưu ảnh trước khi gửi';
  uploadState.originalSize = selectedFile.size;
  uploadState.optimizedSize = selectedFile.size;
  uploadState.durationMs = 0;

  const task = (async () => {
    try {
      const result = await optimizeOrderImage(selectedFile);
      if (token !== uploadToken) return null;

      uploadFile.value = result.file;
      uploadOptimized.value = result.optimized;
      uploadState.originalSize = result.originalSize;
      uploadState.optimizedSize = result.optimizedSize;
      uploadState.durationMs = result.durationMs || 0;
      uploadState.status = 'uploading';
      uploadState.message = 'Đang gửi ảnh về server';
      uploadProgress.value = 15;

      const body = uploadImageBody(result.file, result.optimized);
      const response = draftOrderId.value
        ? await api.patch(`/orders/${draftOrderId.value}/thumbnail`, body, uploadProgressConfig(token))
        : await api.post('/orders', body, uploadProgressConfig(token));

      if (token !== uploadToken) return null;
      draftOrderId.value = response.data.order.id;
      uploadedThumbnail.value = response.data.order.thumbnail;
      uploadState.status = 'done';
      uploadState.message = 'Ảnh đã gửi về server';
      uploadProgress.value = 100;
      success.value = 'Ảnh đã được lưu nhanh, bạn có thể bổ sung thông tin';
      void readOrderImageText(response.data.order.id, token);
      return response.data.order;
    } catch (err) {
      if (token === uploadToken) {
        uploadState.status = 'error';
        uploadState.message = 'Gửi ảnh thất bại';
        uploadProgress.value = 0;
        error.value = apiMessage(err);
      }
      throw err;
    } finally {
      if (token === uploadToken) {
        pendingUpload = null;
      }
    }
  })();

  pendingUpload = task;
  task.catch(() => {});
  return task;
}

async function waitForUpload() {
  if (pendingUpload) {
    try {
      await pendingUpload;
    } catch {
      return false;
    }
  }

  if (!draftOrderId.value && !(uploadFile.value || file.value)) {
    error.value = 'Bạn chưa chọn hình ảnh';
    return false;
  }

  return true;
}

function clearLocalState() {
  form.name = '';
  form.phone = '';
  form.price = '';
  form.sell = true;
  item.category = 'Nhẫn';
  item.price = '';
  items.value = [];
  file.value = null;
  uploadFile.value = null;
  uploadOptimized.value = false;
  draftOrderId.value = '';
  uploadedThumbnail.value = '';
  uploadProgress.value = 0;
  uploadState.status = 'idle';
  uploadState.message = 'Chưa chọn ảnh';
  uploadState.originalSize = 0;
  uploadState.optimizedSize = 0;
  uploadState.durationMs = 0;
  clearOcrSuggestion();
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function reset() {
  uploadToken += 1;
  pendingUpload = null;
  clearLocalState();
  error.value = '';
  success.value = '';
}

async function submit(mode = 'full') {
  error.value = '';
  success.value = '';
  if (!(await waitForUpload())) return;

  loading.value = true;

  try {
    if (draftOrderId.value) {
      if (mode === 'full' || hasOrderDetails()) {
        await api.patch(`/orders/${draftOrderId.value}`, buildOrderPayload());
      }
      uploadToken += 1;
      pendingUpload = null;
      clearLocalState();
      success.value = mode === 'quick' ? 'Lưu nhanh đơn hàng thành công' : 'Thêm đơn hàng thành công';
      return;
    }

    const body = new FormData();
    appendOrderBody(body);
    await api.post('/orders', body);
    uploadToken += 1;
    pendingUpload = null;
    clearLocalState();
    success.value = mode === 'quick' ? 'Lưu nhanh đơn hàng thành công' : 'Thêm đơn hàng thành công';
  } catch (err) {
    error.value = apiMessage(err);
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  uploadToken += 1;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<style scoped>
.order-create__uploader {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-self: start;
}

.order-create__photo-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-create__quick-actions {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
}

.order-create__quick-actions .btn {
  min-height: 44px;
}

.order-create__photo-action {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.4);
}

.order-create__photo-action:not(:disabled):hover {
  border-color: var(--nc-gold);
  background: linear-gradient(135deg, #fffdf7 0%, #ffe9a6 100%);
  box-shadow: 0 4px 12px rgba(138, 90, 6, 0.08);
}

@media (min-width: 720px) {
  .order-create__uploader {
    position: sticky;
    top: 24px;
  }

  .form-row-full {
    grid-column: span 2;
  }
}
</style>
