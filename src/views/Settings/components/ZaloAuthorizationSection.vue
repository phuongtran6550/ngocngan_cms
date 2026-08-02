<template>
  <section id="zalo" aria-labelledby="zalo-authorization-title">
    <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
      <div>
        <h2 id="zalo-authorization-title" class="fs-7 mb-1">Ủy quyền Zalo OA</h2>
        <p class="text-body-tertiary fs-10 mb-0">Kết nối một Official Account để đồng bộ trạng thái vận hành và các luồng thông báo Zalo.</p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button type="button" class="btn btn-phoenix-secondary" :disabled="loading" @click="refreshStatus">Kiểm tra lại</button>
        <button v-if="canConnect" type="button" class="btn btn-primary" :disabled="connecting || loading || !status?.configured" @click="connect">Kết nối Zalo OA</button>
        <button v-else type="button" class="btn btn-phoenix-danger" :disabled="disconnecting || loading" @click="disconnect">Ngắt kết nối</button>
      </div>
    </div>

    <LoadingSkeleton v-if="loading && !status" />

    <div v-else class="row g-4">
      <div class="col-12 col-xl-8">
        <div class="card border shadow-none h-100">
          <div class="card-body p-4">
            <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
              <div>
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="badge badge-phoenix" :class="stateBadgeClass">{{ stateLabel }}</span>
                  <span v-if="status" class="text-body-tertiary fs-10">{{ status.configured ? 'Đã có cấu hình' : 'Thiếu cấu hình môi trường' }}</span>
                </div>
                <h3 class="fs-7 mb-1">{{ status?.oa?.name || 'Chưa có OA kết nối' }}</h3>
                <p class="text-body-tertiary mb-0">{{ statusMessage }}</p>
              </div>
              <div v-if="status?.oa?.avatar" class="rounded-3 overflow-hidden border zalo-avatar">
                <img :src="status.oa.avatar" :alt="status.oa.name" class="w-100 h-100 object-fit-cover" />
              </div>
            </div>

            <div v-if="status?.oa" class="row g-3">
              <div v-for="field in oaFields" :key="field.label" class="col-12 col-md-6">
                <div class="p-3 rounded-3 bg-body-tertiary">
                  <div class="text-body-tertiary fs-10 mb-1">{{ field.label }}</div>
                  <div class="fw-semibold">{{ field.value }}</div>
                </div>
              </div>
            </div>

            <div v-else class="alert alert-subtle-secondary mb-0" role="status">
              <div class="fw-semibold mb-1">Chưa có kết nối nào.</div>
              <div>Nhấn Kết nối Zalo OA để mở trang ủy quyền và cấp quyền cho hệ thống.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-4">
        <div class="card border shadow-none h-100">
          <div class="card-body p-4">
            <h3 class="fs-7 mb-3">Trạng thái vận hành</h3>
            <ul class="list-unstyled mb-0 d-grid gap-3">
              <li v-for="field in operationFields" :key="field.label" class="d-flex justify-content-between gap-3">
                <span class="text-body-tertiary">{{ field.label }}</span>
                <strong>{{ field.value }}</strong>
              </li>
            </ul>
            <div class="alert alert-subtle-info mt-4 mb-0" role="status">
              <div class="fw-semibold mb-1">Ghi chú</div>
              <div>{{ statusMessage }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="alert alert-subtle-danger mt-3 mb-0" role="alert">{{ error }}</div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import { apiError } from "@/request";
import { formatDateTime } from "@/utils/resource-display";
import {
  ZALO_STATE_BADGE_CLASSES,
  ZALO_STATE_LABELS,
  zaloStatusMessage,
} from "@/views/Zalo/presentation";
import { zaloService } from "@/views/Zalo/service";
import type { ZaloStatus } from "@/views/Zalo/types";

export default defineComponent({
  name: "ZaloAuthorizationSection",
  components: { LoadingSkeleton },
  data() {
    return {
      loading: false,
      connecting: false,
      disconnecting: false,
      error: "",
      status: null as ZaloStatus | null,
    };
  },
  computed: {
    canConnect(): boolean {
      return !this.status || this.status.state === "disconnected" || this.status.state === "expired_refresh";
    },
    stateLabel(): string {
      return this.status ? ZALO_STATE_LABELS[this.status.state] : "Chưa tải";
    },
    stateBadgeClass(): string {
      return this.status ? ZALO_STATE_BADGE_CLASSES[this.status.state] : "badge-phoenix-secondary";
    },
    statusMessage(): string {
      return zaloStatusMessage(this.status);
    },
    oaFields(): Array<{ label: string; value: string }> {
      return [
        { label: "OA ID", value: this.status?.oa?.id || "—" },
        { label: "Đã kết nối lúc", value: this.formatDate(this.status?.connectedAt || null) },
        { label: "Access hết hạn", value: this.formatDate(this.status?.accessExpiresAt || null) },
        { label: "Refresh hết hạn", value: this.formatDate(this.status?.refreshExpiresAt || null) },
        { label: "Cập nhật gần nhất", value: this.formatDate(this.status?.lastRefreshedAt || null) },
        { label: "Được kết nối bởi", value: this.status?.connectedBy || "—" },
      ];
    },
    operationFields(): Array<{ label: string; value: string }> {
      return [
        { label: "Cấu hình môi trường", value: this.status?.configured ? "Sẵn sàng" : "Thiếu cấu hình" },
        { label: "Trạng thái hiện tại", value: this.stateLabel },
        { label: "Tự làm mới access", value: this.status?.state === "expired_access" ? "Đang chờ kiểm tra lại" : "Bình thường" },
        { label: "Yêu cầu kết nối lại", value: this.status?.reconnectRequired ? "Có" : "Không" },
      ];
    },
  },
  mounted() {
    void this.refreshStatus();
  },
  methods: {
    formatDate(value: string | null): string {
      return value ? formatDateTime(value) : "—";
    },
    async refreshStatus(): Promise<void> {
      this.loading = true;
      this.error = "";
      try {
        this.status = await zaloService.status();
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.loading = false;
      }
    },
    async connect(): Promise<void> {
      if (!this.status?.configured) {
        this.error = "Thiếu cấu hình môi trường Zalo trong backend.";
        return;
      }
      this.connecting = true;
      this.error = "";
      try {
        const result = await zaloService.authUrl();
        window.location.assign(result.url);
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.connecting = false;
      }
    },
    async disconnect(): Promise<void> {
      this.disconnecting = true;
      this.error = "";
      try {
        await zaloService.disconnect();
        await this.refreshStatus();
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.disconnecting = false;
      }
    },
  },
});
</script>

<style scoped>
.zalo-avatar { width: 72px; height: 72px; }
</style>
