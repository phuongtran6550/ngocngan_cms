<template>
  <section class="page-shell zalo-callback-page">
    <div class="zalo-callback-card">
      <!-- Processing -->
      <template v-if="processing">
        <div class="zalo-callback__spinner"></div>
        <h2>Đang kết nối Zalo OA...</h2>
        <p class="muted">Vui lòng chờ trong giây lát</p>
      </template>

      <!-- Success -->
      <template v-else-if="success">
        <div class="zalo-callback__icon zalo-callback__icon--success">
          <Icon icon="heroicons-outline:check-circle" />
        </div>
        <h2>Kết nối thành công!</h2>
        <p class="muted">
          {{ oaName ? `Đã kết nối với ${oaName}` : 'Zalo OA đã được kết nối' }}
        </p>
        <p class="muted">Đang chuyển hướng...</p>
      </template>

      <!-- Error -->
      <template v-else>
        <div class="zalo-callback__icon zalo-callback__icon--error">
          <Icon icon="heroicons-outline:x-circle" />
        </div>
        <h2>Kết nối thất bại</h2>
        <p class="muted">{{ errorMessage }}</p>
        <router-link class="btn btn-primary" to="/zalo">
          <Icon icon="heroicons-outline:arrow-left" />
          Quay lại trang Zalo
        </router-link>
      </template>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Icon from '@/components/Icon';
import { api, apiMessage } from '@/services/api';

const route = useRoute();
const router = useRouter();

const processing = ref(true);
const success = ref(false);
const oaName = ref('');
const errorMessage = ref('');

onMounted(async () => {
  const code = route.query.code;

  if (!code) {
    processing.value = false;
    errorMessage.value = 'Không tìm thấy mã ủy quyền. Vui lòng thử kết nối lại.';
    return;
  }

  try {
    const { data } = await api.post('/zalo/callback', { code });
    success.value = true;
    oaName.value = data.oaName || '';

    // Auto-redirect after 2 seconds
    setTimeout(() => {
      router.push('/zalo');
    }, 2000);
  } catch (err) {
    errorMessage.value = apiMessage(err);
  } finally {
    processing.value = false;
  }
});
</script>

<style scoped>
.zalo-callback-page {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 50vh;
}

.zalo-callback-card {
  align-items: center;
  background: #fffdf7;
  border: 1px solid #eadab4;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(138, 90, 6, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 420px;
  padding: 42px 28px;
  text-align: center;
  width: 100%;
}

.zalo-callback-card h2 {
  font-size: 20px;
  margin: 0;
}

.zalo-callback__spinner {
  animation: spin 1s linear infinite;
  border: 3px solid var(--nc-line);
  border-radius: 50%;
  border-top-color: #0068ff;
  height: 42px;
  width: 42px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.zalo-callback__icon {
  align-items: center;
  border-radius: 50%;
  display: flex;
  font-size: 36px;
  height: 64px;
  justify-content: center;
  width: 64px;
}

.zalo-callback__icon--success {
  background: var(--nc-jade-soft);
  color: var(--nc-emerald);
}

.zalo-callback__icon--error {
  background: #fef3f2;
  color: #b42318;
}
</style>
