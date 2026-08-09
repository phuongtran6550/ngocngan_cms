<template>
  <div>
    <PageHeader
      title="Hướng dẫn cài đặt máy in"
      description="Thiết lập một lần để in tem GoDEX G500 trực tiếp từ website."
      :breadcrumbs="breadcrumbs"
    >
    </PageHeader>

    <div class="card border-0 guide-intro mb-4 overflow-hidden">
      <div class="card-body p-4 p-lg-5 position-relative">
        <div class="guide-glow" aria-hidden="true" />
        <div class="row align-items-center g-4 position-relative">
          <div class="col-12 col-lg">
            <span class="guide-eyebrow">GoDEX G500 qua USB</span>
            <h2 class="h4 mt-2 mb-2">
              Chọn hệ điều hành của máy đang nối máy in
            </h2>
            <p class="text-body-secondary mb-0 guide-copy">
              Chúng tôi đã chọn sẵn theo trình duyệt. Bạn vẫn có thể đổi lại
              trước khi tải bộ cài.
            </p>
          </div>
          <div class="col-12 col-lg-auto">
            <div
              class="platform-switch"
              role="group"
              aria-label="Chọn hệ điều hành"
            >
              <button
                v-for="platform in platforms"
                :key="platform.value"
                type="button"
                class="platform-option"
                :class="{ active: selectedPlatform === platform.value }"
                :aria-pressed="selectedPlatform === platform.value"
                @click="selectedPlatform = platform.value"
              >
                <span class="platform-mark" aria-hidden="true">
                  {{ platform.shortLabel }}
                </span>
                <span>
                  <strong>{{ platform.label }}</strong>
                  <small>{{ platform.description }}</small>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 align-items-start">
      <div class="col-12 col-xl-8">
        <div class="d-grid gap-3">
          <article class="card border-0 shadow-sm guide-step">
            <div class="card-body p-4">
              <div class="step-layout">
                <span class="step-number">1</span>
                <div class="min-w-0">
                  <h2 class="h5 mb-2">Kết nối máy in và cài driver</h2>
                  <p class="text-body-tertiary mb-3">
                    Cắm GoDEX G500 vào máy tính bằng cáp USB, bật nguồn và cài
                    driver chính thức của GoDEX cho {{ selectedPlatformLabel }}.
                  </p>
                  <div class="guide-note">
                    <AppIcon name="help-circle" />
                    <span>
                      Chỉ tiếp tục khi máy tính đã hiển thị GoDEX G500 trong
                      danh sách máy in.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article class="card border-0 shadow-sm guide-step">
            <div class="card-body p-4">
              <div class="step-layout">
                <span class="step-number">2</span>
                <div class="min-w-0">
                  <h2 class="h5 mb-2">Cài Ứng dụng in Ngọc Châu</h2>
                  <p class="text-body-tertiary mb-3">
                    Tải đúng bộ cài cho {{ selectedPlatformLabel }}, mở tệp vừa
                    tải và làm theo hướng dẫn trên màn hình.
                  </p>

                  <div
                    v-if="releaseLoading"
                    class="release-box text-body-tertiary"
                    role="status"
                  >
                    <span
                      class="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    />
                    <span>Đang kiểm tra bộ cài…</span>
                  </div>

                  <div
                    v-else-if="releaseError"
                    class="alert alert-subtle-danger mb-0"
                    role="alert"
                  >
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <span class="flex-grow-1">{{ releaseError }}</span>
                      <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        @click="loadReleases"
                      >
                        Kiểm tra lại
                      </button>
                    </div>
                  </div>

                  <div v-else class="release-box">
                    <div class="min-w-0">
                      <span class="release-platform">
                        Bộ cài cho {{ selectedPlatformLabel }}
                      </span>
                      <strong class="d-block text-break mt-1">
                        {{ selectedRelease?.filename }}
                      </strong>
                      <span
                        v-if="selectedRelease?.available"
                        class="d-block text-body-tertiary fs-9 mt-1"
                      >
                        Phiên bản {{ selectedRelease.version }} ·
                        {{ fileSize(selectedRelease.size) }}
                      </span>
                      <span
                        v-else
                        class="d-block text-warning-emphasis fs-9 mt-1"
                      >
                        Bộ cài đang được chuẩn bị
                      </span>
                    </div>
                    <button
                      type="button"
                      class="btn btn-primary flex-shrink-0"
                      :disabled="!selectedRelease?.available || downloading"
                      @click="downloadInstaller"
                    >
                      <span
                        v-if="downloading"
                        class="spinner-border spinner-border-sm"
                        aria-hidden="true"
                      />
                      <AppIcon v-else name="download" />
                      <span class="ms-1">
                        {{ downloading ? "Đang tải…" : "Tải bộ cài" }}
                      </span>
                    </button>
                  </div>

                  <div
                    v-if="downloadError"
                    class="alert alert-subtle-danger py-2 mt-3 mb-0"
                    role="alert"
                  >
                    {{ downloadError }}
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article class="card border-0 shadow-sm guide-step">
            <div class="card-body p-4">
              <div class="step-layout">
                <span class="step-number">3</span>
                <div class="min-w-0">
                  <h2 class="h5 mb-2">Mở ứng dụng và in ngay</h2>
                  <p class="text-body-tertiary mb-3">
                    Mở Ứng dụng in Ngọc Châu trên máy đã nối GoDEX G500. Ứng dụng
                    tự gọi API và chờ lệnh in; không cần đăng ký, token hay mã kết nối.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="col-12 col-xl-4">
        <aside class="card border-0 shadow-sm readiness-card">
          <div class="card-body p-4">
            <span class="badge badge-phoenix badge-phoenix-success mb-3">
              Trước khi bắt đầu
            </span>
            <h2 class="h5 mb-3">Bạn cần chuẩn bị</h2>
            <ul class="readiness-list mb-0">
              <li><span>✓</span> Máy in GoDEX G500 và cáp USB</li>
              <li><span>✓</span> Driver đúng với hệ điều hành</li>
              <li><span>✓</span> Kết nối Internet ổn định</li>
              <li><span>✓</span> Quyền cài ứng dụng trên máy tính</li>
            </ul>
            <div class="guide-divider" />
            <p class="fs-9 text-body-tertiary mb-0">
              Bộ cài Ngọc Châu không thay đổi driver, cổng USB hay thông số giấy
              của máy in.
            </p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/app/PageHeader.vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { apiError } from "@/request";
import { browserDownload } from "@/utils/file-download";
import { printDeviceService } from "@/views/PrintDevices/service";
import type {
  PrintBridgeRelease,
  PrintPlatform,
} from "@/views/PrintDevices/types";

const platforms: Array<{
  value: PrintPlatform;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "windows",
    label: "Windows",
    shortLabel: "W",
    description: "Windows 10 hoặc 11",
  },
];

// Ứng dụng in chỉ có bản Windows vì nó gửi dữ liệu tem qua RAW spooler
// của Windows tới GoDEX G500.
function browserPlatform(): PrintPlatform {
  return "windows";
}

const sizeFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});

export default defineComponent({
  name: "PrintGuidePage",
  components: { AppIcon, PageHeader },
  data() {
    return {
      platforms,
      selectedPlatform: browserPlatform() as PrintPlatform,
      releases: [] as PrintBridgeRelease[],
      releaseLoading: true,
      releaseError: "",
      downloadError: "",
      downloading: false,
      releaseController: null as AbortController | null,
    };
  },
  computed: {
    breadcrumbs(): Array<{ label: string; to?: string }> {
      return [
        { label: "Hàng nhập kho", to: "/warehoused-goods" },
        { label: "Hướng dẫn cài đặt máy in" },
      ];
    },
    selectedPlatformLabel(): string {
      return this.platforms.find(
        (platform) => platform.value === this.selectedPlatform,
      )?.label || "Windows";
    },
    selectedRelease(): PrintBridgeRelease | null {
      return this.releases.find(
        (release) => release.platform === this.selectedPlatform,
      ) || null;
    },
  },
  mounted() {
    void this.loadReleases();
  },
  beforeUnmount() {
    this.releaseController?.abort();
  },
  methods: {
    fileSize(value: number | null): string {
      if (!Number.isFinite(value) || Number(value) < 0) return "—";
      const bytes = Number(value);
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 ** 2) {
        return `${sizeFormatter.format(bytes / 1024)} KB`;
      }
      return `${sizeFormatter.format(bytes / 1024 ** 2)} MB`;
    },
    async loadReleases(): Promise<void> {
      this.releaseController?.abort();
      const controller = new AbortController();
      this.releaseController = controller;
      this.releaseLoading = true;
      this.releaseError = "";
      this.downloadError = "";
      try {
        const releases = await printDeviceService.releases(controller.signal);
        if (!controller.signal.aborted) this.releases = releases;
      } catch (error) {
        if (!controller.signal.aborted) {
          this.releaseError = apiError(error).message;
        }
      } finally {
        if (this.releaseController === controller) {
          this.releaseLoading = false;
          this.releaseController = null;
        }
      }
    },
    async downloadInstaller(): Promise<void> {
      const release = this.selectedRelease;
      if (!release?.available || this.downloading) return;
      this.downloading = true;
      this.downloadError = "";
      try {
        const result = await printDeviceService.downloadRelease(
          release.platform,
          release.filename,
        );
        browserDownload(result.blob, result.filename);
      } catch (error) {
        this.downloadError = apiError(error).message;
      } finally {
        this.downloading = false;
      }
    },
  },
});
</script>

<style scoped>
.guide-intro {
  color: #fff;
  background:
    linear-gradient(118deg, rgba(7, 45, 44, 0.98), rgba(13, 94, 82, 0.94)),
    radial-gradient(circle at 80% 20%, rgba(247, 186, 70, 0.3), transparent 45%);
}

.guide-glow {
  position: absolute;
  top: -6rem;
  right: -3rem;
  width: 16rem;
  height: 16rem;
  border-radius: 50%;
  background: rgba(247, 186, 70, 0.18);
  filter: blur(4px);
}

.guide-eyebrow {
  color: #f7cf7a;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.guide-copy {
  max-width: 40rem;
  color: rgba(255, 255, 255, 0.72) !important;
}

.platform-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  min-width: min(100%, 22rem);
  padding: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.08);
}

.platform-option {
  display: flex;
  gap: 0.625rem;
  align-items: center;
  min-width: 0;
  padding: 0.7rem;
  border: 0;
  border-radius: 0.75rem;
  color: rgba(255, 255, 255, 0.76);
  text-align: left;
  background: transparent;
}

.platform-option.active {
  color: #123f3a;
  background: #fff;
  box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.16);
}

.platform-option strong,
.platform-option small {
  display: block;
}

.platform-option small {
  margin-top: 0.1rem;
  font-size: 0.68rem;
  opacity: 0.72;
}

.platform-mark {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 0.55rem;
  color: #123f3a;
  background: #f7cf7a;
  font-weight: 900;
}

.guide-step {
  border-left: 0.25rem solid #0d5e52 !important;
}

.step-layout {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr);
  gap: 1rem;
}

.step-number {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border-radius: 0.8rem;
  color: #fff;
  background: #0d5e52;
  font-weight: 800;
}

.guide-note {
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
  padding: 0.75rem 0.875rem;
  border-radius: 0.75rem;
  color: var(--phoenix-info-text-emphasis);
  background: var(--phoenix-info-bg-subtle);
  font-size: 0.8rem;
}

.guide-note .cms-icon {
  flex: 0 0 auto;
  margin-top: 0.05rem;
}

.release-box {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid var(--phoenix-border-color);
  border-radius: 0.875rem;
  background: var(--phoenix-emphasis-bg);
}

.release-platform {
  color: var(--phoenix-success-text-emphasis);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.readiness-card {
  position: sticky;
  top: 5.5rem;
  overflow: hidden;
}

.readiness-card::before {
  display: block;
  height: 0.3rem;
  background: linear-gradient(90deg, #0d5e52, #e8b54b);
  content: "";
}

.readiness-list {
  display: grid;
  gap: 0.875rem;
  padding: 0;
  list-style: none;
}

.readiness-list li {
  display: grid;
  grid-template-columns: 1.5rem minmax(0, 1fr);
  gap: 0.5rem;
  align-items: start;
}

.readiness-list span {
  display: grid;
  width: 1.35rem;
  height: 1.35rem;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #0d5e52;
  font-size: 0.68rem;
  font-weight: 900;
}

.guide-divider {
  height: 1px;
  margin: 1.25rem 0;
  background: var(--phoenix-border-color);
}

@media (max-width: 1199.98px) {
  .readiness-card {
    position: static;
  }
}

@media (max-width: 575.98px) {
  .guide-intro .card-body,
  .guide-step .card-body,
  .readiness-card .card-body {
    padding: 1.125rem !important;
  }

  .platform-switch {
    min-width: 0;
  }

  .platform-option {
    flex-direction: column;
    align-items: flex-start;
  }

  .step-layout {
    grid-template-columns: 2.25rem minmax(0, 1fr);
    gap: 0.75rem;
  }

  .step-number {
    width: 2.25rem;
    height: 2.25rem;
  }

  .release-box {
    align-items: stretch;
    flex-direction: column;
  }

  .release-box .btn {
    width: 100%;
  }
}
</style>
