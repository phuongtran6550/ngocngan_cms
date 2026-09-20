<template>
  <div
    v-if="hasActions"
    ref="menu"
    class="btn-reveal-trigger position-static"
    data-testid="row-action-menu"
  >
    <button
      ref="button"
      type="button"
      class="btn btn-sm dropdown-toggle dropdown-caret-none transition-none btn-reveal fs-10"
      data-testid="row-action-toggle"
      :aria-expanded="open"
      :aria-label="`Thao tác với ${resourceLabel}`"
      @click.stop="toggleMenu"
    >
      <AppIcon name="more-horizontal" />
      <span class="visually-hidden">Thao tác</span>
    </button>

    <Teleport to="body">
      <div v-if="open" ref="dropdownMenu" class="dropdown-menu py-2 show m-0" role="menu">
        <button
          v-if="canView"
          type="button"
          class="dropdown-item"
          data-testid="row-action-view"
          :aria-label="`Xem ${resourceLabel}`"
          @click="select('view')"
        >
          Chi tiết
        </button>
        <button
          v-if="canEdit"
          type="button"
          class="dropdown-item"
          data-testid="row-action-edit"
          :aria-label="`Sửa ${resourceLabel}`"
          @click="select('edit')"
        >
          Sửa
        </button>
        <div v-if="canDelete && (canView || canEdit)" class="dropdown-divider" />
        <button
          v-if="canDelete"
          type="button"
          class="dropdown-item text-danger"
          data-testid="row-action-delete"
          :aria-label="`Xóa ${resourceLabel}`"
          @click="select('delete')"
        >
          Xóa
        </button>
        <div v-if="canRestore && (canView || canEdit || canDelete)" class="dropdown-divider" />
        <button
          v-if="canRestore"
          type="button"
          class="dropdown-item text-success"
          data-testid="row-action-restore"
          :aria-label="`Khôi phục ${resourceLabel}`"
          @click="select('restore')"
        >
          Khôi phục
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw, nextTick } from "vue";
import { createPopper, type Instance as PopperInstance } from "@popperjs/core";
import AppIcon from "@/components/ui/AppIcon.vue";
import { createDropdownBehavior } from "@/components/dropdown/behavior";

type RowAction = "view" | "edit" | "delete" | "restore";

export default defineComponent({
  name: "RowActionMenu",
  components: { AppIcon },
  props: {
    canView: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canRestore: { type: Boolean, default: false },
    resourceLabel: { type: String, default: "bản ghi" },
  },
  emits: ["view", "edit", "delete", "restore"],
  data() {
    return {
      open: false,
      popper: null as PopperInstance | null,
      dropdown: createDropdownBehavior(
        () => {
          const els: HTMLElement[] = [];
          if (this.$refs.menu) els.push(this.$refs.menu as HTMLElement);
          if (this.$refs.dropdownMenu) els.push(this.$refs.dropdownMenu as HTMLElement);
          return els;
        },
        () => {
          this.closeMenu();
        },
      ),
    };
  },
  computed: {
    hasActions(): boolean {
      return this.canView || this.canEdit || this.canDelete || this.canRestore;
    },
  },
  mounted() {
    this.dropdown.mount();
  },
  beforeUnmount() {
    this.dropdown.dispose();
    this.destroyPopper();
  },
  methods: {
    async toggleMenu() {
      this.open = !this.open;
      if (this.open) {
        await nextTick();
        const button = this.$refs.button as HTMLElement;
        const menu = this.$refs.dropdownMenu as HTMLElement;
        this.popper = markRaw(
          createPopper(button, menu, {
            placement: "bottom-end",
            modifiers: [
              {
                name: "offset",
                options: {
                  offset: [0, 4],
                },
              },
            ],
          })
        );
      } else {
        this.destroyPopper();
      }
    },
    closeMenu() {
      this.open = false;
      this.destroyPopper();
    },
    destroyPopper() {
      if (this.popper) {
        this.popper.destroy();
        this.popper = null;
      }
    },
    select(action: RowAction): void {
      this.closeMenu();
      this.$emit(action);
    },
  },
});
</script>
