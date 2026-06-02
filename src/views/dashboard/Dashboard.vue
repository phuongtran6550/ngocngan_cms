<template>
  <section class="page-shell dashboard-page dashboard-command">
    <div class="page-head dashboard-command__head">
      <div class="page-title">
        <h1>Tổng quan vận hành</h1>
        <p class="muted">
          Hôm nay {{ report.period.today || '-' }} · 30 ngày gần nhất
          <span v-if="periodText">({{ periodText }})</span>
        </p>
      </div>
      <div class="dashboard-actions">
        <button class="btn btn-light" type="button" :disabled="loading" @click="load">
          <Icon icon="heroicons-outline:arrow-path" />
          Làm mới
        </button>
        <button class="btn btn-primary page-actions" type="button" @click="downloadExport">
          <Icon icon="heroicons-outline:arrow-down-tray" />
          Export CSV
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="loading" class="dashboard-loading-grid" aria-label="Đang tải Dashboard">
      <div v-for="item in 6" :key="item" class="dashboard-skeleton"></div>
    </div>

    <template v-else>
      <div class="dashboard-kpi-grid">
        <article v-for="card in kpiCards" :key="card.key" class="dashboard-kpi">
          <div class="dashboard-kpi__icon" :class="card.tone">
            <Icon :icon="card.icon" />
          </div>
          <div class="dashboard-kpi__body">
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
            <small>{{ card.detail }}</small>
          </div>
          <div class="dashboard-kpi__trend" :class="trendClass(card)">
            <Icon :icon="trendIcon(card)" />
            {{ trendText(card) }}
          </div>
        </article>
      </div>

      <div class="dashboard-chart-grid">
        <article class="dashboard-panel dashboard-panel--main">
          <div class="dashboard-panel__head">
            <div>
              <h2>Doanh thu và đổi trả theo ngày</h2>
              <p class="muted">So sánh doanh thu bán, chi phí đổi trả, lãi ròng và số đơn</p>
            </div>
          </div>
          <div v-if="hasDailyData" class="dashboard-chart">
            <apexchart height="330" type="line" :options="revenueChartOptions" :series="revenueChartSeries" />
          </div>
          <div v-else class="dashboard-empty">
            <Icon icon="heroicons-outline:chart-bar" />
            Chưa có dữ liệu giao dịch trong kỳ này
          </div>
        </article>

        <div class="dashboard-side-stack">
          <article class="dashboard-panel">
            <div class="dashboard-panel__head">
              <div>
                <h2>Cảnh báo quản lý</h2>
                <p class="muted">Ưu tiên cần xem trong hôm nay</p>
              </div>
            </div>
            <div class="dashboard-alert-list">
              <div v-for="alert in report.alerts" :key="alert.title" class="dashboard-alert" :class="`is-${alert.type}`">
                <Icon :icon="alertIcon(alert.type)" />
                <div>
                  <strong>{{ alert.title }}</strong>
                  <span>{{ alert.message }}</span>
                </div>
              </div>
            </div>
          </article>

          <article class="dashboard-panel">
            <div class="dashboard-panel__head">
              <div>
                <h2>Cơ cấu giao dịch</h2>
                <p class="muted">Tỷ trọng bán hàng và đổi trả</p>
              </div>
            </div>
            <div v-if="hasTransactionMix" class="dashboard-donut">
              <apexchart height="220" type="donut" :options="mixChartOptions" :series="mixChartSeries" />
            </div>
            <div v-else class="dashboard-empty dashboard-empty--compact">Chưa có giao dịch</div>
          </article>
        </div>
      </div>

      <div class="dashboard-insight-grid">
        <article class="dashboard-panel">
          <div class="dashboard-panel__head">
            <div>
              <h2>Top khách hàng</h2>
              <p class="muted">Theo doanh thu bán trong kỳ</p>
            </div>
            <RouterLink class="dashboard-panel__link" to="/customers">Xem khách</RouterLink>
          </div>
          <div v-if="report.topCustomers.length" class="dashboard-list">
            <div v-for="(customer, index) in report.topCustomers" :key="customer.phone || customer.name" class="dashboard-list-row">
              <span class="dashboard-rank">{{ index + 1 }}</span>
              <div>
                <strong>{{ customer.name || 'Khách lẻ' }}</strong>
                <small>{{ customer.phone || '-' }} · {{ customer.orders || 0 }} đơn</small>
              </div>
              <b>{{ compactMoney(customer.totalSell) }}</b>
            </div>
          </div>
          <div v-else class="dashboard-empty dashboard-empty--compact">Chưa có khách hàng nổi bật</div>
        </article>

        <article class="dashboard-panel">
          <div class="dashboard-panel__head">
            <div>
              <h2>Top nguồn hàng</h2>
              <p class="muted">Theo giá trị nguồn hàng</p>
            </div>
            <RouterLink class="dashboard-panel__link" to="/source-of-goods">Xem nguồn</RouterLink>
          </div>
          <div v-if="report.topSources.length" class="dashboard-list">
            <div v-for="(source, index) in report.topSources" :key="source.id || source.phone || source.name" class="dashboard-list-row">
              <span class="dashboard-rank">{{ index + 1 }}</span>
              <div>
                <strong>{{ source.name || 'Nguồn hàng' }}</strong>
                <small>{{ source.phone || '-' }}</small>
              </div>
              <b>{{ compactMoney(source.price) }}</b>
            </div>
          </div>
          <div v-else class="dashboard-empty dashboard-empty--compact">Chưa có nguồn hàng</div>
        </article>

        <article class="dashboard-panel">
          <div class="dashboard-panel__head">
            <div>
              <h2>Kho giá trị cao</h2>
              <p class="muted">{{ money(report.summary.inventoryValue) }} trong kho</p>
            </div>
            <RouterLink class="dashboard-panel__link" to="/warehoused-goods">Xem kho</RouterLink>
          </div>
          <div v-if="report.inventoryHighlights.length" class="dashboard-list">
            <RouterLink
              v-for="item in report.inventoryHighlights"
              :key="item.id || item.name"
              class="dashboard-list-row dashboard-list-row--link"
              :to="item.id ? `/warehoused-goods/${item.id}` : '/warehoused-goods'"
            >
              <span class="dashboard-thumb">
                <img v-if="item.thumbnail" :src="assetUrl(item.thumbnail)" alt="">
                <Icon v-else icon="heroicons-outline:cube" />
              </span>
              <div>
                <strong>{{ item.name || 'Hàng trong kho' }}</strong>
                <small>{{ item.phone || '-' }}</small>
              </div>
              <b>{{ compactMoney(item.price) }}</b>
            </RouterLink>
          </div>
          <div v-else class="dashboard-empty dashboard-empty--compact">Kho chưa có dữ liệu</div>
        </article>
      </div>

      <article class="dashboard-panel">
        <div class="dashboard-panel__head">
          <div>
            <h2>Hoạt động gần đây</h2>
            <p class="muted">10 đơn mới nhất để quản lý kiểm tra nhanh</p>
          </div>
          <RouterLink class="dashboard-panel__link" to="/orders">Xem đơn</RouterLink>
        </div>
        <div v-if="report.recentOrders.length" class="dashboard-recent table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Loại</th>
                <th>Người tạo</th>
                <th>Ngày</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in report.recentOrders" :key="order.id || order.createdAt">
                <td>
                  <RouterLink class="dashboard-order-link" :to="order.id ? `/orders/${order.id}` : '/orders'">
                    <strong>{{ order.name || 'Khách lẻ' }}</strong>
                    <small>{{ order.phone || '-' }}</small>
                  </RouterLink>
                </td>
                <td>
                  <span :class="['badge', order.type === 'Bán hàng' ? 'badge-green' : 'badge-yellow']">{{ order.type }}</span>
                </td>
                <td>{{ order.creator || 'Administrator' }}</td>
                <td>{{ dateTime(order.createdAt) }}</td>
                <td class="money">{{ money(order.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="dashboard-empty">Chưa có đơn hàng gần đây</div>
      </article>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import Icon from '@/components/Icon';
import { api, apiMessage, assetUrl } from '@/services/api';

const error = ref('');
const loading = ref(true);

function emptyReport() {
  return {
    period: { today: '', current: { from: '', to: '' }, previous: { from: '', to: '' } },
    summary: {
      totalSell: 0,
      totalReturn: 0,
      netRevenue: 0,
      sellOrders: 0,
      returnOrders: 0,
      returnRate: 0,
      todayOrders: 0,
      newCustomers: 0,
      newSources: 0,
      inventoryItems: 0,
      inventoryValue: 0
    },
    comparison: {
      totalSell: 0,
      totalReturn: 0,
      netRevenue: 0,
      sellOrders: 0,
      returnOrders: 0,
      returnRate: 0,
      newCustomers: 0,
      newSources: 0,
      inventoryItems: 0
    },
    dailySeries: [],
    transactionMix: [],
    topCustomers: [],
    topSources: [],
    inventoryHighlights: [],
    recentOrders: [],
    alerts: []
  };
}

const report = ref(emptyReport());

const periodText = computed(() => {
  const current = report.value.period.current;
  return current.from && current.to ? `${current.from} → ${current.to}` : '';
});

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' vnđ';
}

function compactMoney(value) {
  const number = Number(value || 0);
  const abs = Math.abs(number);
  if (abs >= 1000000000) {
    return `${(number / 1000000000).toFixed(1)} tỷ`;
  }
  if (abs >= 1000000) {
    return `${(number / 1000000).toFixed(1)} triệu`;
  }
  return money(number);
}

function numberText(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function percentText(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}%`;
}

function normalizeReport(data) {
  const fallback = emptyReport();
  return {
    ...fallback,
    ...data,
    period: { ...fallback.period, ...(data?.period || {}) },
    summary: { ...fallback.summary, ...(data?.summary || {}) },
    comparison: { ...fallback.comparison, ...(data?.comparison || {}) },
    dailySeries: Array.isArray(data?.dailySeries) ? data.dailySeries : [],
    transactionMix: Array.isArray(data?.transactionMix) ? data.transactionMix : [],
    topCustomers: Array.isArray(data?.topCustomers) ? data.topCustomers : [],
    topSources: Array.isArray(data?.topSources) ? data.topSources : [],
    inventoryHighlights: Array.isArray(data?.inventoryHighlights) ? data.inventoryHighlights : [],
    recentOrders: Array.isArray(data?.recentOrders) ? data.recentOrders : [],
    alerts: Array.isArray(data?.alerts) ? data.alerts : []
  };
}

const kpiCards = computed(() => {
  const summary = report.value.summary;
  const comparison = report.value.comparison;
  return [
    {
      key: 'sell',
      label: 'Doanh thu bán',
      value: compactMoney(summary.totalSell),
      detail: money(summary.totalSell),
      trend: comparison.totalSell,
      icon: 'heroicons-outline:banknotes',
      tone: 'is-green'
    },
    {
      key: 'return',
      label: 'Chi phí đổi trả',
      value: compactMoney(summary.totalReturn),
      detail: `Tỷ lệ đổi trả ${percentText(summary.returnRate)}`,
      trend: comparison.totalReturn,
      inverseTrend: true,
      icon: 'heroicons-outline:receipt-refund',
      tone: 'is-gold'
    },
    {
      key: 'net',
      label: 'Lãi ròng ước tính',
      value: compactMoney(summary.netRevenue),
      detail: `${numberText(summary.sellOrders + summary.returnOrders)} đơn trong kỳ`,
      trend: comparison.netRevenue,
      icon: 'heroicons-outline:presentation-chart-line',
      tone: 'is-blue'
    },
    {
      key: 'today',
      label: 'Đơn hôm nay',
      value: numberText(summary.todayOrders),
      detail: `${numberText(summary.sellOrders)} đơn bán trong 30 ngày`,
      trend: comparison.sellOrders,
      icon: 'heroicons-outline:calendar-days',
      tone: 'is-jade'
    },
    {
      key: 'customers',
      label: 'Khách mới',
      value: numberText(summary.newCustomers),
      detail: `${numberText(summary.newSources)} nguồn hàng mới`,
      trend: comparison.newCustomers,
      icon: 'heroicons-outline:user-group',
      tone: 'is-violet'
    },
    {
      key: 'inventory',
      label: 'Hàng trong kho',
      value: numberText(summary.inventoryItems),
      detail: money(summary.inventoryValue),
      trend: comparison.inventoryItems,
      icon: 'heroicons-outline:cube',
      tone: 'is-ink'
    }
  ];
});

function trendClass(card) {
  const value = Number(card.trend || 0);
  if (!value) {
    return 'is-neutral';
  }
  const isGood = card.inverseTrend ? value < 0 : value > 0;
  return isGood ? 'is-good' : 'is-bad';
}

function trendIcon(card) {
  const value = Number(card.trend || 0);
  if (!value) {
    return 'heroicons-outline:minus';
  }
  return value > 0 ? 'heroicons-outline:arrow-trending-up' : 'heroicons-outline:arrow-trending-down';
}

function trendText(card) {
  const value = Number(card.trend || 0);
  if (!value) {
    return '0% kỳ trước';
  }
  return `${value > 0 ? '+' : ''}${percentText(value)} kỳ trước`;
}

function alertIcon(type) {
  return (
    {
      danger: 'heroicons-outline:fire',
      warning: 'heroicons-outline:exclamation-triangle',
      info: 'heroicons-outline:information-circle',
      success: 'heroicons-outline:check-circle'
    }[type] || 'heroicons-outline:information-circle'
  );
}

function seriesDate(date) {
  const parts = String(date || '').split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
}

function dateTime(value) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/dashboard/overview');
    report.value = normalizeReport(data);
  } catch (err) {
    error.value = apiMessage(err);
    report.value = emptyReport();
  } finally {
    loading.value = false;
  }
}

async function downloadExport() {
  try {
    const response = await api.get('/export/orders', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    error.value = apiMessage(err);
  }
}

const hasDailyData = computed(() =>
  report.value.dailySeries.some((day) => day.sell || day.returns || day.netRevenue || day.sellOrders || day.returnOrders)
);

const hasTransactionMix = computed(() => report.value.transactionMix.some((item) => item.value));

const revenueChartSeries = computed(() => [
  {
    name: 'Doanh thu bán',
    type: 'column',
    data: report.value.dailySeries.map((day) => Number(day.sell || 0))
  },
  {
    name: 'Đổi trả',
    type: 'column',
    data: report.value.dailySeries.map((day) => Number(day.returns || 0))
  },
  {
    name: 'Lãi ròng',
    type: 'line',
    data: report.value.dailySeries.map((day) => Number(day.netRevenue || 0))
  },
  {
    name: 'Số đơn',
    type: 'line',
    data: report.value.dailySeries.map((day) => Number(day.sellOrders || 0) + Number(day.returnOrders || 0))
  }
]);

const revenueChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'Inter, ui-sans-serif, system-ui'
  },
  colors: ['#0f766e', '#d6a12a', '#2563eb', '#6d7169'],
  dataLabels: { enabled: false },
  grid: {
    borderColor: '#e8e2d5',
    strokeDashArray: 4
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
    markers: { radius: 6 }
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '54%'
    }
  },
  stroke: {
    width: [0, 0, 3, 3],
    curve: 'smooth'
  },
  xaxis: {
    categories: report.value.dailySeries.map((day) => seriesDate(day.date)),
    labels: {
      rotate: -35,
      style: { colors: '#6d7169', fontSize: '11px' }
    }
  },
  yaxis: [
    {
      labels: { formatter: (value) => compactMoney(value), style: { colors: '#6d7169' } }
    },
    {
      opposite: true,
      seriesName: 'Số đơn',
      labels: { formatter: (value) => `${Math.round(value)} đơn`, style: { colors: '#6d7169' } }
    }
  ],
  tooltip: {
    shared: true,
    y: {
      formatter(value, context) {
        return context.seriesIndex === 3 ? `${Math.round(value)} đơn` : money(value);
      }
    }
  }
}));

const mixChartSeries = computed(() => report.value.transactionMix.map((item) => Number(item.value || 0)));

const mixChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    fontFamily: 'Inter, ui-sans-serif, system-ui'
  },
  colors: ['#0f766e', '#d6a12a', '#2563eb'],
  dataLabels: { enabled: false },
  labels: report.value.transactionMix.map((item) => item.label),
  legend: {
    position: 'bottom',
    fontSize: '12px'
  },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Tổng đơn',
            formatter() {
              return numberText(report.value.summary.sellOrders + report.value.summary.returnOrders);
            }
          }
        }
      }
    }
  }
}));

onMounted(load);
</script>
