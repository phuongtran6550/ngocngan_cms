<template>
  <section>
    <PageHeader title="Xử lý kết nối Zalo OA" description="Trang này tiếp nhận callback từ Zalo và xác nhận an toàn trước khi lưu trạng thái kết nối.">
      <template #actions><RouterLink class="btn btn-phoenix-secondary" to="/settings#zalo">Quay lại Cài đặt</RouterLink></template>
    </PageHeader>

    <LoadingSkeleton v-if="loading" />

    <div v-else class="row justify-content-center">
      <div class="col-12 col-lg-8 col-xl-7">
        <div v-if="error" class="alert alert-subtle-danger" role="alert">
          <div class="fw-semibold mb-1">Không thể hoàn tất kết nối</div>
          <div>{{ error }}</div>
        </div>

        <div v-else-if="status" class="card border shadow-none">
          <div class="card-body p-4 p-md-5">
            <div class="d-flex align-items-start justify-content-between gap-3 mb-4">
              <div>
                <div class="badge badge-phoenix badge-phoenix-success mb-3">Đã xử lý xong</div>
                <h2 class="fs-6 mb-2">{{ status.oa?.name || 'Zalo OA' }}</h2>
                <p class="text-body-tertiary mb-0">Kết nối đã được ghi nhận an toàn vào hệ thống.</p>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-12 col-md-6">
                <div class="p-3 rounded-3 bg-body-tertiary">
                  <div class="text-body-tertiary fs-10 mb-1">Trạng thái</div>
                  <div class="fw-semibold">{{ stateLabel }}</div>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="p-3 rounded-3 bg-body-tertiary">
                  <div class="text-body-tertiary fs-10 mb-1">Kết nối lúc</div>
                  <div class="fw-semibold">{{ formatDate(status.connectedAt) }}</div>
                </div>
              </div>
            </div>

            <div class="alert alert-subtle-info mt-4 mb-0" role="status">
              <div class="fw-semibold mb-1">Tiếp theo</div>
              <div>Quay lại trang Cài đặt để kiểm tra trạng thái và quản lý kết nối Zalo OA.</div>
            </div>
          </div>
        </div>

        <div v-else class="alert alert-subtle-secondary" role="status">Đang chờ dữ liệu callback từ Zalo...</div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterLink } from "vue-router";
import PageHeader from "@/components/app/PageHeader.vue";
import LoadingSkeleton from "@/components/placeholder/LoadingSkeleton.vue";
import { zaloService } from "@/views/Zalo/service";
import type { ZaloCallbackInput, ZaloStatus } from "@/views/Zalo/types";
import { ZALO_STATE_LABELS } from "@/views/Zalo/presentation";
import { apiError } from "@/request";
import { formatDateTime } from "@/utils/resource-display";

function valueFromQuery(value: unknown): string | undefined {
  if (Array.isArray(value)) return String(value[0] || '').trim() || undefined;
  return String(value || '').trim() || undefined;
}

export default defineComponent({
  name: "ZaloCallbackPage",
  components: { LoadingSkeleton, PageHeader, RouterLink },
  data() {
    return {
      loading: true,
      error: "",
      status: null as ZaloStatus | null,
    };
  },
  computed: {
    stateLabel(): string {
      return this.status ? ZALO_STATE_LABELS[this.status.state] : "Đang xử lý";
    },
  },
  mounted() {
    void this.handleCallback();
  },
  methods: {
    formatDate(value: string | null): string {
      return value ? formatDateTime(value) : "—";
    },
    async handleCallback(): Promise<void> {
      this.loading = true;
      this.error = "";
      try {
        const query = this.$route.query as Record<string, unknown>;
        const payload: ZaloCallbackInput = {
          code: valueFromQuery(query.code),
          state: valueFromQuery(query.state),
          error: valueFromQuery(query.error),
          errorDescription: valueFromQuery(query.error_description || query.errorDescription),
        };
        this.status = await zaloService.callback(payload);
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>
