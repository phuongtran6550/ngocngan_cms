<template>
  <div class="card border-0 shadow-sm" data-testid="print-device-card">
    <div class="card-body p-3 p-md-4">
      <div class="d-flex flex-column flex-lg-row gap-3 align-items-lg-center">
        <div class="device-mark flex-shrink-0" aria-hidden="true">
          <AppIcon name="settings" />
        </div>

        <div class="min-w-0 flex-grow-1">
          <div v-if="editing" class="d-flex flex-column flex-sm-row gap-2">
            <label class="visually-hidden" :for="`device-name-${device.deviceId}`">
              Tên hiển thị
            </label>
            <input
              :id="`device-name-${device.deviceId}`"
              ref="nameInput"
              v-model="draftName"
              name="printDeviceName"
              class="form-control form-control-sm"
              maxlength="80"
              :disabled="busy"
              @keyup.enter="saveName"
              @keyup.esc="cancelRename"
            />
            <div class="d-flex gap-2">
              <button
                type="button"
                class="btn btn-sm btn-primary"
                data-testid="save-print-device-name"
                :disabled="busy || !draftName.trim()"
                @click="saveName"
              >
                Lưu
              </button>
              <button
                type="button"
                class="btn btn-sm btn-phoenix-secondary"
                :disabled="busy"
                @click="cancelRename"
              >
                Hủy
              </button>
            </div>
          </div>
          <template v-else>
            <div class="d-flex flex-wrap align-items-center gap-2">
              <h2 class="h6 mb-0 text-break">{{ device.displayName }}</h2>
              <span v-if="device.isDefault" class="badge text-bg-primary-subtle text-primary">
                Mặc định
              </span>
            </div>
            <div class="d-flex flex-wrap align-items-center gap-2 mt-2 fs-10">
              <span class="badge" :class="statusClass">{{ statusLabel }}</span>
              <span class="text-body-tertiary">{{ platformLabel }}</span>
              <span v-if="lastSeenLabel" class="text-body-tertiary">
                · {{ lastSeenLabel }}
              </span>
            </div>
          </template>
        </div>

        <div
          v-if="!editing && device.status === 'active'"
          class="d-flex flex-wrap gap-2 justify-content-lg-end"
        >
          <button
            type="button"
            class="btn btn-sm btn-phoenix-secondary"
            data-testid="rename-print-device"
            :disabled="busy"
            @click="startRename"
          >
            <AppIcon name="edit" class="me-1" />
            Đổi tên
          </button>
          <button
            v-if="!device.isDefault"
            type="button"
            class="btn btn-sm btn-phoenix-secondary"
            data-testid="make-default-print-device"
            :disabled="busy"
            @click="$emit('make-default', device.deviceId)"
          >
            <AppIcon name="user-check" class="me-1" />
            Chọn mặc định
          </button>
          <button
            type="button"
            class="btn btn-sm btn-link text-danger text-decoration-none"
            data-testid="revoke-print-device"
            :disabled="busy"
            @click="$emit('revoke', device)"
          >
            <AppIcon name="trash-2" class="me-1" />
            Ngắt kết nối
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import type { PrintDevice } from "@/views/PrintDevices/types";

export default defineComponent({
  name: "PrintDeviceCard",
  components: { AppIcon },
  props: {
    device: { type: Object as PropType<PrintDevice>, required: true },
    busy: Boolean,
  },
  emits: ["rename", "make-default", "revoke"],
  data() {
    return {
      editing: false,
      draftName: this.device.displayName,
    };
  },
  computed: {
    platformLabel(): string {
      return this.device.platform === "macos" ? "macOS" : "Windows";
    },
    statusLabel(): string {
      if (this.device.status === "revoked") return "Đã ngắt kết nối";
      const labels = {
        ready: "Sẵn sàng",
        bridgeOffline: "Ứng dụng in trên máy tính đang tắt",
        offline: "Không thể kết nối máy in",
        missing: "Không tìm thấy máy in",
        error: "Cần kiểm tra",
      } as const;
      return labels[this.device.readiness];
    },
    statusClass(): string {
      if (this.device.status === "revoked") return "text-bg-secondary-subtle text-secondary";
      if (this.device.readiness === "ready") return "text-bg-success-subtle text-success";
      if (this.device.readiness === "bridgeOffline") return "text-bg-warning-subtle text-warning-emphasis";
      return "text-bg-danger-subtle text-danger";
    },
    lastSeenLabel(): string {
      if (!this.device.lastSeenAt) return "Chưa kết nối";
      const date = new Date(this.device.lastSeenAt);
      if (Number.isNaN(date.getTime())) return "";
      return `Kết nối gần nhất ${new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date)}`;
    },
  },
  methods: {
    async startRename(): Promise<void> {
      this.draftName = this.device.displayName;
      this.editing = true;
      await this.$nextTick();
      const input = this.$refs.nameInput as HTMLInputElement | undefined;
      input?.focus();
      input?.select();
    },
    cancelRename(): void {
      this.editing = false;
      this.draftName = this.device.displayName;
    },
    saveName(): void {
      const displayName = this.draftName.trim();
      if (!displayName || this.busy) return;
      this.$emit("rename", this.device.deviceId, displayName);
      this.editing = false;
    },
  },
});
</script>

<style scoped>
.device-mark {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border-radius: 0.75rem;
  color: var(--phoenix-primary);
  background: var(--phoenix-primary-bg-subtle);
}

.min-w-0 {
  min-width: 0;
}
</style>
