<template>
  <div
    v-if="open"
    ref="menu"
    class="dropdown-menu dropdown-menu-end navbar-dropdown-caret py-0 dropdown-profile shadow border show"
    data-testid="profile-menu"
    aria-labelledby="navbarDropdownUser"
    role="menu"
    @click.stop
  >
    <div class="card position-relative border-0">
      <div class="card-body p-0">
        <div class="text-center pt-4 pb-3">
          <AppAvatar size="xl" :src="avatar" />
          <h6 class="mt-2 text-body-emphasis">{{ displayName }}</h6>
        </div>
        <div class="mb-3 mx-3">
          <input
            v-model="statusMessage"
            class="form-control form-control-sm"
            data-testid="profile-status-input"
            type="text"
            placeholder="Cập nhật trạng thái"
            aria-label="Cập nhật trạng thái"
          />
        </div>
      </div>
      <div class="overflow-auto scrollbar" style="height: 10rem">
        <ul class="nav d-flex flex-column mb-2 pb-1">
          <li v-if="profileAllowed" class="nav-item">
            <RouterLink
              class="nav-link px-3 d-block"
              data-testid="profile-link"
              role="menuitem"
              to="/profile"
              @click="$emit('close')"
            >
              <AppIcon class="me-2 text-body align-bottom" name="user" />
              <span>Hồ sơ cá nhân</span>
            </RouterLink>
          </li>
          <li
            v-for="entry in navigationEntries"
            :key="entry.key"
            class="nav-item"
          >
            <RouterLink
              class="nav-link px-3 d-block"
              :data-testid="`profile-navigation-${entry.key}`"
              role="menuitem"
              :to="entry.path"
              @click="$emit('close')"
            >
              <AppIcon class="me-2 text-body align-bottom" :name="entry.icon" />
              <span>{{ entry.label }}</span>
            </RouterLink>
          </li>
          <li v-if="profileAllowed" class="nav-item">
            <button
              type="button"
              class="nav-link btn btn-link px-3 d-block w-100 text-start"
              data-testid="change-password-action"
              role="menuitem"
              @click="changePassword"
            >
              <AppIcon class="me-2 text-body align-bottom" name="lock" />
              <span>Đổi mật khẩu</span>
            </button>
          </li>
        </ul>
      </div>
      <div class="card-footer p-0 border-top border-translucent">
        <ul v-if="profileAllowed" class="nav d-flex flex-column my-3">
          <li class="nav-item">
            <RouterLink
              class="nav-link px-3 d-block"
              data-testid="profile-security-link"
              role="menuitem"
              to="/profile/change-password"
              @click="$emit('close')"
            >
              <AppIcon class="me-2 text-body align-bottom" name="key" />
              <span>Tài khoản &amp; bảo mật</span>
            </RouterLink>
          </li>
        </ul>
        <hr />
        <div class="px-3">
          <button
            type="button"
            class="btn btn-phoenix-secondary d-flex flex-center w-100"
            data-testid="logout-action"
            @click="$emit('logout')"
          >
            <AppIcon class="me-2" name="logout" /> Đăng xuất
          </button>
        </div>
        <div class="my-2 text-center fw-bold fs-10 text-body-quaternary">
          Chính sách bảo mật <span class="mx-1">&bull;</span> Điều khoản
          <span class="mx-1">&bull;</span> Cookie
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { createDropdownBehavior } from "@/components/dropdown/behavior";
import AppIcon from "@/components/ui/AppIcon.vue";
import AppAvatar from "@/components/ui/AppAvatar.vue";

interface ProfileNavigationEntry {
  key: string;
  label: string;
  path: string;
  icon: string;
}

export default defineComponent({
  name: "ProfileMenu",
  components: { AppAvatar, AppIcon },
  props: {
    open: { type: Boolean, required: true },
    displayName: { type: String, required: true },
    avatar: { type: String, default: "" },
    profileAllowed: { type: Boolean, default: false },
    navigationEntries: {
      type: Array as PropType<ProfileNavigationEntry[]>,
      default: () => [],
    },
  },
  emits: ["close", "change-password", "logout"],
  data() {
    return {
      statusMessage: "",
      dropdown: createDropdownBehavior(
        () => this.$refs.menu as HTMLElement | undefined,
        () => this.$emit("close"),
      ),
    };
  },
  mounted() {
    this.dropdown.mount();
  },
  beforeUnmount() {
    this.dropdown.dispose();
  },
  methods: {
    changePassword(): void {
      this.$emit("change-password");
      this.$emit("close");
    },
  },
});
</script>
