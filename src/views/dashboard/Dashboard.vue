<template>
  <section class="page-shell dashboard-page">
    <div class="page-head">
      <div class="page-title">
        <h1>Báo cáo bán hàng</h1>
        <p class="muted">Doanh số trong 30 ngày gần đây</p>
      </div>
      <button class="btn btn-primary page-actions" type="button" @click="downloadExport">
        <Icon icon="heroicons-outline:arrow-down-tray" />
        Export CSV
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="stats-grid">
      <article class="metric-card stat">
        <span class="muted">Doanh thu bán</span>
        <strong>+{{ money(report.summary.totalSell) }}</strong>
      </article>
      <article class="metric-card stat">
        <span class="muted">Chi phí đổi trả</span>
        <strong>-{{ money(report.summary.totalReturn) }}</strong>
      </article>
    </div>

    <div class="table-card">
      <div class="panel-body table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Bán hàng</th>
              <th>Đổi trả</th>
              <th>Biểu đồ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in nonEmptyDays" :key="day.date">
              <td>{{ day.date }}</td>
              <td class="money">+{{ money(day.sell) }}</td>
              <td class="money">-{{ money(day.delivery) }}</td>
              <td>
                <div class="bar"><span :style="{ width: barWidth(day.sell) }"></span></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import Icon from '@/components/Icon';
import { api, apiMessage } from '@/services/api';

const error = ref('');
const report = reactive({ summary: { totalSell: 0, totalReturn: 0 }, days: [] });
const nonEmptyDays = computed(() => report.days.filter((day) => day.sell || day.delivery));
const maxSell = computed(() => Math.max(...report.days.map((day) => day.sell), 1));

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' vnđ';
}

function barWidth(value) {
  return `${Math.max((value / maxSell.value) * 100, value ? 4 : 0)}%`;
}

async function load() {
  try {
    const { data } = await api.get('/dashboard/sales');
    report.summary = data.summary;
    report.days = data.days;
  } catch (err) {
    error.value = apiMessage(err);
  }
}

async function downloadExport() {
  const response = await api.get('/export/orders', { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `orders-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

onMounted(load);
</script>
