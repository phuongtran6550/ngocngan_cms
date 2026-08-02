<template>
  <component
    :is="nested ? 'li' : 'div'"
    :class="nested ? 'nav-item' : 'nav-item-wrapper'"
  >
    <RouterLink
      v-if="entry.path && !hasChildren"
      :to="entry.path"
      class="nav-link"
      :class="[`label-${level}`, { active: activeBranch }]"
      :title="collapsed ? entry.label : undefined"
      @click="emit('navigate')"
    >
      <div class="d-flex align-items-center">
        <span v-if="entry.icon" class="nav-link-icon"><AppIcon :name="entry.icon" /></span>
        <span class="nav-link-text-wrapper">
          <span class="nav-link-text">{{ entry.label }}</span>
        </span>
      </div>
    </RouterLink>

    <template v-else-if="hasChildren">
      <a
        :href="`#${submenuId}`"
        class="nav-link dropdown-indicator"
        :class="[`label-${level}`, { active: activeBranch }]"
        role="button"
        data-bs-toggle="collapse"
        :aria-controls="submenuId"
        :aria-expanded="activeBranch"
      >
        <div class="d-flex align-items-center">
          <div class="dropdown-indicator-icon-wrapper">
            <svg
              class="svg-inline--fa fa-caret-right dropdown-indicator-icon"
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="caret-right"
              data-fa-i2svg=""
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 512"
            >
              <path
                fill="currentColor"
                d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z"
              />
            </svg>
          </div>
          <span v-if="entry.icon" class="nav-link-icon"><AppIcon :name="entry.icon" /></span>
          <span class="nav-link-text">{{ entry.label }}</span>
        </div>
      </a>

      <div class="parent-wrapper" :class="`label-${level}`">
        <ul
          :id="submenuId"
          class="nav collapse parent"
          :data-bs-parent="`#${parentId}`"
          data-sidebar-submenu="true"
          :data-sidebar-active="activeBranch"
        >
          <li class="collapsed-nav-item-title d-none">{{ entry.label }}</li>
          <SidebarNavItem
            v-for="(child, index) in entry.children"
            :key="child.key"
            :entry="child"
            :level="level + 1"
            :node-id="`${nodeId}-${index}`"
            :parent-id="submenuId"
            :collapsed="collapsed"
            nested
            @navigate="emit('navigate')"
          />
        </ul>
      </div>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppIcon from "@/components/ui/AppIcon.vue";
import { entryContainsPath, type NavigationEntry } from "@/config/navigation";

defineOptions({ name: "SidebarNavItem" });

const props = withDefaults(defineProps<{
  entry: NavigationEntry;
  level: number;
  nodeId: string;
  parentId: string;
  collapsed?: boolean;
  nested?: boolean;
}>(), {
  collapsed: false,
  nested: false,
});
const emit = defineEmits<{ navigate: [] }>();
const route = useRoute();

const hasChildren = computed(() => Boolean(props.entry.children?.length));
const activeBranch = computed(() => entryContainsPath(props.entry, route.path));
const submenuId = computed(() => `sidebar-submenu-${props.nodeId}`);
</script>
