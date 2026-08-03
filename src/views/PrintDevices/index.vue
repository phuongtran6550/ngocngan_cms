<template>
  <div>
    <PageHeader
      title="Thiết bị in"
      description="Kết nối GoDEX G500 để in tem trực tiếp từ trang hàng nhập kho."
    >
      <template #actions>
        <div class="d-flex gap-2">
          <RouterLink
            to="/print-guide"
            class="btn btn-phoenix-secondary"
            aria-label="Hướng dẫn cài đặt máy in"
            data-testid="open-print-guide-header"
          >
            <AppIcon name="help-circle" />
            <span class="d-none d-sm-inline ms-1">Hướng dẫn cài đặt</span>
          </RouterLink>
          <button
            type="button"
            class="btn btn-phoenix-secondary"
            :disabled="loading || actionBusy"
            aria-label="Tải lại trạng thái"
            @click="loadDevices"
          >
            <AppIcon name="refresh" />
            <span class="d-none d-sm-inline ms-1">Tải lại</span>
          </button>
          <button
            type="button"
            class="btn btn-primary"
            data-testid="create-pairing-code"
            :disabled="pairingBusy || actionBusy"
            @click="createPairingCode"
          >
            <AppIcon name="plus" />
            <span class="d-none d-sm-inline ms-1">Kết nối máy in</span>
          </button>
        </div>
      </template>
    </PageHeader>

    <div v-if="notice" class="alert alert-success py-2" role="status">
      {{ notice }}
    </div>
    <div v-if="error" class="alert alert-danger d-flex flex-wrap gap-2 align-items-center" role="alert">
      <span class="flex-grow-1">{{ error }}</span>
      <button type="button" class="btn btn-sm btn-danger" @click="loadDevices">
        Thử lại
      </button>
    </div>

    <div v-if="loading" class="card border-0 shadow-sm">
      <div class="card-body py-5 text-center text-body-tertiary" aria-live="polite">
        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true" />
        Đang kiểm tra máy in…
      </div>
    </div>

    <div v-else-if="!devices.length" class="card border-0 shadow-sm">
      <div class="card-body p-4 p-lg-5">
        <div class="mx-auto setup-panel">
          <div class="text-center mb-4">
            <div class="setup-icon mx-auto mb-3" aria-hidden="true">
              <AppIcon name="settings" />
            </div>
            <h2 class="h5">Kết nối máy in tem</h2>
            <p class="text-body-tertiary mb-0">
              Chỉ cần thiết lập một lần trên máy tính đang nối với GoDEX G500.
            </p>
          </div>

          <ol class="setup-steps mb-4">
            <li data-testid="print-setup-step">
              <span>1</span>
              <div>
                <strong>Kết nối GoDEX G500 và cài driver.</strong>
                <p class="mb-0 text-body-tertiary fs-9">
                  Máy tính cần nhận máy in trước khi tiếp tục.
                </p>
              </div>
            </li>
            <li data-testid="print-setup-step">
              <span>2</span>
              <div>
                <strong>Cài Ứng dụng in Ngọc Châu.</strong>
                <p class="mb-0 text-body-tertiary fs-9">
                  Mở ứng dụng sau khi cài xong.
                </p>
              </div>
            </li>
            <li data-testid="print-setup-step">
              <span>3</span>
              <div>
                <strong>Tạo và nhập mã kết nối.</strong>
                <p class="mb-0 text-body-tertiary fs-9">
                  Mã chỉ dùng một lần và tự hết hạn.
                </p>
              </div>
            </li>
          </ol>

          <div class="d-flex flex-wrap justify-content-center gap-2">
            <RouterLink
              to="/print-guide"
              class="btn btn-phoenix-secondary"
              data-testid="open-print-guide-empty"
            >
              <AppIcon name="help-circle" class="me-1" />
              Xem hướng dẫn cài đặt
            </RouterLink>
            <button
              type="button"
              class="btn btn-primary"
              data-testid="create-pairing-code"
              :disabled="pairingBusy"
              @click="createPairingCode"
            >
              <AppIcon name="plus" class="me-1" />
              Tạo mã kết nối
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="d-grid gap-3">
      <PrintDeviceCard
        v-for="device in devices"
        :key="device.deviceId"
        :device="device"
        :busy="actionBusy"
        @rename="renameDevice"
        @make-default="makeDefault"
        @revoke="requestRevoke"
      />
    </div>

    <PairingDialog
      :open="pairingOpen"
      :code="pairingCode"
      :busy="pairingBusy"
      @close="closePairing"
      @check="checkPairing"
    />

    <ConfirmDialog
      :open="Boolean(revokeTarget)"
      title="Ngắt kết nối máy in?"
      :message="`Sau khi ngắt kết nối, ${revokeTarget?.displayName || 'máy in này'} sẽ không nhận lệnh in mới.`"
      confirm-label="Ngắt kết nối"
      @cancel="revokeTarget = null"
      @confirm="revokeDevice"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import ConfirmDialog from "@/components/overlay/ConfirmDialog.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import PrintDeviceCard from "@/views/PrintDevices/components/PrintDeviceCard.vue";
import PairingDialog from "@/views/PrintDevices/components/PairingDialog.vue";
import { printDeviceService } from "@/views/PrintDevices/service";
import type { PrintDevice } from "@/views/PrintDevices/types";
import { apiError } from "@/request";

export default defineComponent({
  name: "PrintDevicesPage",
  components: {
    PageHeader,
    ConfirmDialog,
    AppIcon,
    PrintDeviceCard,
    PairingDialog,
  },
  data() {
    return {
      devices: [] as PrintDevice[],
      loading: true,
      actionBusy: false,
      pairingBusy: false,
      pairingOpen: false,
      pairingCode: "",
      error: "",
      notice: "",
      revokeTarget: null as PrintDevice | null,
    };
  },
  mounted() {
    void this.loadDevices();
  },
  methods: {
    async loadDevices(): Promise<void> {
      this.loading = true;
      this.error = "";
      try {
        this.devices = await printDeviceService.list();
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.loading = false;
      }
    },
    async createPairingCode(): Promise<void> {
      this.pairingBusy = true;
      this.error = "";
      try {
        const result = await printDeviceService.createPairingCode();
        this.pairingCode = result.code;
        this.pairingOpen = true;
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.pairingBusy = false;
      }
    },
    closePairing(): void {
      if (!this.pairingBusy) this.pairingOpen = false;
    },
    async checkPairing(): Promise<void> {
      this.pairingBusy = true;
      this.error = "";
      try {
        const devices = await printDeviceService.list();
        this.devices = devices;
        if (devices.some((device) => device.status === "active")) {
          this.pairingOpen = false;
          this.notice = "GoDEX G500 đã được kết nối.";
        } else {
          this.error = "Chưa thấy máy in kết nối. Hãy kiểm tra lại mã trên ứng dụng in.";
        }
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.pairingBusy = false;
      }
    },
    async renameDevice(deviceId: string, displayName: string): Promise<void> {
      await this.runAction(async () => {
        const updated = await printDeviceService.rename(deviceId, displayName);
        this.devices = this.devices.map((device) =>
          device.deviceId === deviceId ? { ...device, ...updated } : device,
        );
        this.notice = "Đã cập nhật tên máy in.";
      });
    },
    async makeDefault(deviceId: string): Promise<void> {
      await this.runAction(async () => {
        await printDeviceService.makeDefault(deviceId);
        this.devices = this.devices.map((device) => ({
          ...device,
          isDefault: device.deviceId === deviceId,
        }));
        this.notice = "Đã chọn máy in mặc định.";
      });
    },
    requestRevoke(device: PrintDevice): void {
      this.revokeTarget = device;
    },
    async revokeDevice(): Promise<void> {
      const target = this.revokeTarget;
      if (!target) return;
      await this.runAction(async () => {
        await printDeviceService.revoke(target.deviceId);
        this.devices = this.devices.filter(
          (device) => device.deviceId !== target.deviceId,
        );
        this.revokeTarget = null;
        this.notice = "Đã ngắt kết nối máy in.";
      });
    },
    async runAction(action: () => Promise<void>): Promise<void> {
      this.actionBusy = true;
      this.error = "";
      this.notice = "";
      try {
        await action();
      } catch (error) {
        this.error = apiError(error).message;
      } finally {
        this.actionBusy = false;
      }
    },
  },
});
</script>

<style scoped>
.setup-panel {
  max-width: 42rem;
}

.setup-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 0.875rem;
  color: var(--phoenix-primary);
  background: var(--phoenix-primary-bg-subtle);
}

.setup-steps {
  display: grid;
  gap: 1rem;
  padding: 0;
  list-style: none;
}

.setup-steps li {
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr);
  gap: 0.875rem;
  align-items: start;
}

.setup-steps li > span {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: 50%;
  color: var(--phoenix-primary);
  background: var(--phoenix-primary-bg-subtle);
  font-weight: 700;
}
</style>
