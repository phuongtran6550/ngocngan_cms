<template>
  <section class="page-shell zalo-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Quản lý Zalo OA</h1>
        <p class="muted">Kết nối Zalo Official Account để gửi thông báo ZNS</p>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <!-- Loading -->
    <div v-if="loading" class="zalo-card zalo-card--loading">
      <div class="zalo-card__spinner"></div>
      <p class="muted">Đang tải trạng thái kết nối...</p>
    </div>

    <!-- Not Connected -->
    <div v-else-if="!status.connected" class="zalo-card">
      <div class="zalo-card__icon zalo-card__icon--disconnected">
        <Icon icon="heroicons-outline:link" />
      </div>
      <div class="zalo-card__content">
        <h2>Chưa kết nối Zalo OA</h2>
        <p class="muted">
          Kết nối Zalo Official Account để tự động gửi thông báo ZNS cho khách hàng
          khi tạo đơn hàng mới hoặc cập nhật trạng thái.
        </p>
        <div class="zalo-card__actions">
          <button
            class="btn btn-zalo"
            type="button"
            :disabled="connecting"
            @click="connect"
          >
            <Icon icon="heroicons-outline:bolt" />
            {{ connecting ? 'Đang kết nối...' : 'Kết nối Zalo OA' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Connected -->
    <div v-else class="zalo-card zalo-card--connected">
      <div class="zalo-card__header">
        <div class="zalo-card__icon zalo-card__icon--connected">
          <Icon icon="heroicons-outline:check-badge" />
        </div>
        <div>
          <span
            class="zalo-badge"
            :class="badgeClass"
          >
            {{ badgeLabel }}
          </span>
        </div>
      </div>

      <div class="zalo-card__content">
        <h2>{{ status.oaName || 'Zalo Official Account' }}</h2>

        <div class="zalo-info-grid">
          <div class="zalo-info-item">
            <span class="zalo-info-label">Trạng thái</span>
            <span class="zalo-info-value" :class="statusClass">{{ statusLabel }}</span>
          </div>
          <div v-if="status.connectedAt" class="zalo-info-item">
            <span class="zalo-info-label">Ngày kết nối</span>
            <span class="zalo-info-value">{{ formatDate(status.connectedAt) }}</span>
          </div>
          <div v-if="status.expiresAt" class="zalo-info-item">
            <span class="zalo-info-label">Access Token hết hạn</span>
            <span class="zalo-info-value" :class="{ 'text-danger': status.accessExpired }">
              {{ formatDate(status.expiresAt) }}
              <span v-if="status.accessExpired" class="zalo-expired-tag">Đã hết hạn</span>
            </span>
          </div>
          <div v-if="status.refreshExpiresAt" class="zalo-info-item">
            <span class="zalo-info-label">Refresh Token hết hạn</span>
            <span class="zalo-info-value" :class="{ 'text-danger': status.refreshExpired }">
              {{ formatDate(status.refreshExpiresAt) }}
              <span v-if="status.refreshExpired" class="zalo-expired-tag">Đã hết hạn</span>
            </span>
          </div>
          <div v-if="status.lastRefreshedAt" class="zalo-info-item">
            <span class="zalo-info-label">Làm mới token lần cuối</span>
            <span class="zalo-info-value">{{ formatDate(status.lastRefreshedAt) }}</span>
          </div>
        </div>

        <div class="zalo-card__actions">
          <button
            v-if="status.refreshExpired"
            class="btn btn-zalo"
            type="button"
            :disabled="connecting"
            @click="connect"
          >
            <Icon icon="heroicons-outline:arrow-path" />
            {{ connecting ? 'Đang kết nối...' : 'Kết nối lại' }}
          </button>
          <button
            class="btn btn-danger"
            type="button"
            :disabled="disconnecting"
            @click="confirmDisconnect"
          >
            <Icon icon="heroicons-outline:x-circle" />
            {{ disconnecting ? 'Đang hủy...' : 'Hủy kết nối' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Help section -->
    <div class="zalo-help">
      <details>
        <summary>
          <Icon icon="heroicons-outline:question-mark-circle" />
          Hướng dẫn sử dụng
        </summary>
        <div class="zalo-help__content">
          <ol>
            <li>Bấm <strong>"Kết nối Zalo OA"</strong> để bắt đầu quá trình ủy quyền</li>
            <li>Đăng nhập tài khoản Zalo và chọn Official Account cần kết nối</li>
            <li>Cấp quyền gửi tin nhắn cho ứng dụng</li>
            <li>Hệ thống tự động lưu token và gửi ZNS khi có đơn hàng mới</li>
          </ol>
          <p class="muted">
            <strong>Lưu ý:</strong> Access Token có hiệu lực 25 giờ và được tự động làm mới.
            Refresh Token có hiệu lực 3 tháng — sau đó bạn cần kết nối lại.
          </p>
        </div>
      </details>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import Icon from '@/components/Icon';
import { api, apiMessage } from '@/services/api';
import dayjs from 'dayjs';

const status = ref({ connected: false });
const loading = ref(true);
const connecting = ref(false);
const disconnecting = ref(false);
const error = ref('');
const success = ref('');

const badgeClass = computed(() => {
  if (status.value.refreshExpired) return 'zalo-badge--danger';
  if (status.value.accessExpired) return 'zalo-badge--warning';
  return 'zalo-badge--success';
});

const badgeLabel = computed(() => {
  if (status.value.refreshExpired) return 'Cần kết nối lại';
  if (status.value.accessExpired) return 'Token đang làm mới';
  return 'Đã kết nối';
});

const statusClass = computed(() => {
  if (status.value.refreshExpired) return 'text-danger';
  return 'text-success';
});

const statusLabel = computed(() => {
  if (status.value.refreshExpired) return 'Token hết hạn — cần kết nối lại';
  if (status.value.accessExpired) return 'Access token hết hạn — sẽ tự làm mới';
  return 'Hoạt động bình thường';
});

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('HH:mm DD/MM/YYYY');
}

async function loadStatus() {
  loading.value = true;
  try {
    const { data } = await api.get('/zalo/status');
    status.value = data;
  } catch (err) {
    error.value = apiMessage(err);
  } finally {
    loading.value = false;
  }
}

async function connect() {
  connecting.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/zalo/auth-url');
    // Open Zalo OAuth in same window — Zalo will redirect back to our callback
    window.location.href = data.url;
  } catch (err) {
    error.value = apiMessage(err);
    connecting.value = false;
  }
}

async function confirmDisconnect() {
  if (!window.confirm('Bạn có chắc muốn hủy kết nối Zalo OA? Hệ thống sẽ không thể gửi thông báo ZNS cho đến khi kết nối lại.')) {
    return;
  }

  disconnecting.value = true;
  error.value = '';
  success.value = '';
  try {
    await api.delete('/zalo/disconnect');
    success.value = 'Đã hủy kết nối Zalo OA';
    await loadStatus();
  } catch (err) {
    error.value = apiMessage(err);
  } finally {
    disconnecting.value = false;
  }
}

onMounted(() => loadStatus());
</script>

<style scoped>
.zalo-page {
  max-width: 680px;
}

.zalo-card {
  background: #fffdf7;
  border: 1px solid #eadab4;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(138, 90, 6, 0.06);
  padding: 28px;
}

.zalo-card--loading {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 48px 28px;
}

.zalo-card__spinner {
  animation: spin 1s linear infinite;
  border: 3px solid var(--nc-line);
  border-radius: 50%;
  border-top-color: var(--nc-gold);
  height: 36px;
  width: 36px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.zalo-card__header {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  margin-bottom: 18px;
}

.zalo-card__icon {
  align-items: center;
  border-radius: 12px;
  display: flex;
  flex: 0 0 auto;
  font-size: 28px;
  height: 52px;
  justify-content: center;
  width: 52px;
}

.zalo-card__icon--disconnected {
  background: var(--nc-gold-soft);
  color: var(--nc-gold-deep);
}

.zalo-card__icon--connected {
  background: var(--nc-jade-soft);
  color: var(--nc-emerald);
}

.zalo-card__content {
  display: grid;
  gap: 14px;
}

.zalo-card__content h2 {
  font-size: 20px;
  margin: 0;
}

.zalo-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}

.btn-zalo {
  align-items: center;
  background: linear-gradient(135deg, #0068ff 0%, #0052cc 100%);
  border: 1px solid transparent;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 104, 255, 0.2);
  color: #ffffff;
  display: inline-flex;
  font-weight: 700;
  gap: 6px;
  justify-content: center;
  min-height: 42px;
  padding: 8px 18px;
  transition: opacity 160ms ease, transform 80ms ease;
}

.btn-zalo:hover {
  opacity: 0.92;
}

.btn-zalo:active {
  transform: scale(0.98);
}

.btn-zalo:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.zalo-badge {
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
}

.zalo-badge--success {
  background: var(--nc-jade-soft);
  color: #05645d;
}

.zalo-badge--warning {
  background: var(--nc-gold-soft);
  color: var(--nc-gold-deep);
}

.zalo-badge--danger {
  background: #fef3f2;
  color: #b42318;
}

.zalo-info-grid {
  display: grid;
  gap: 10px;
}

.zalo-info-item {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.zalo-info-label {
  color: var(--nc-muted);
  font-size: 13px;
  white-space: nowrap;
}

.zalo-info-value {
  font-size: 13px;
  font-weight: 700;
  text-align: right;
}

.text-danger {
  color: #b42318;
}

.text-success {
  color: #05645d;
}

.zalo-expired-tag {
  background: #fef3f2;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 800;
  margin-left: 6px;
  padding: 2px 6px;
}

.zalo-help {
  margin-top: 18px;
}

.zalo-help details {
  background: #fffdf7;
  border: 1px solid #eadab4;
  border-radius: 8px;
}

.zalo-help summary {
  align-items: center;
  cursor: pointer;
  display: flex;
  font-weight: 700;
  gap: 8px;
  list-style: none;
  padding: 14px 16px;
}

.zalo-help summary::-webkit-details-marker {
  display: none;
}

.zalo-help__content {
  border-top: 1px solid #eadab4;
  padding: 16px;
}

.zalo-help__content ol {
  margin: 0;
  padding-left: 20px;
}

.zalo-help__content li {
  margin-bottom: 8px;
}

.zalo-help__content p {
  margin: 12px 0 0;
}
</style>
