<template>
  <section class="card identity-card">
    <div class="card-body">
      <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h2 class="fs-8 mb-1">Thông tin khách hàng</h2>
          <p class="text-body-tertiary fs-10 mb-0">Không bắt buộc lúc bán. Nếu bỏ trống, hệ thống sẽ đọc ảnh nền và đưa vào hàng chờ kiểm duyệt.</p>
        </div>
        <span class="badge badge-phoenix badge-phoenix-secondary">Tùy chọn</span>
      </div>
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <label class="form-label" for="sale-customer-name">Tên khách hàng</label>
          <input id="sale-customer-name" :value="name" class="form-control" maxlength="100" autocomplete="name" placeholder="Có thể bổ sung sau" @input="$emit('update:name', value($event))" />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label" for="sale-customer-phone">Số điện thoại</label>
          <input id="sale-customer-phone" :value="phone" class="form-control" maxlength="50" inputmode="tel" autocomplete="tel" placeholder="Ví dụ 0962 633 838" @input="$emit('update:phone', value($event))" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ name: string; phone: string }>();
defineEmits<{ "update:name": [value: string]; "update:phone": [value: string] }>();
function value(event: Event): string { return (event.target as HTMLInputElement).value; }
</script>

<style scoped>
.identity-card { border: 1px dashed var(--phoenix-border-color-translucent); background: color-mix(in srgb, var(--phoenix-tertiary-bg) 55%, transparent); }
</style>
