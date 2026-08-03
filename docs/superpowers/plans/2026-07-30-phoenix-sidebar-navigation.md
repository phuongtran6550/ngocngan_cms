# Phoenix Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. This repository has an explicit no-Git-command rule: do not run Git commands or create commits. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the structurally incomplete sidebar with the Phoenix v1.24.0 navigation tree shipped in Template2, aligning icons, labels, headings, active states, submenu disclosure, collapsed rail behavior, and the mobile drawer.

**Architecture:** `Template2/public/reference/pages/demo/vertical-sidenav.html` defines the DOM contract. `navigation.ts` remains the source of route-derived groups, ordering, and authorization; `Sidebar.vue` owns only ephemeral submenu state and renders the Template2-native wrappers; `app-option.ts` continues to own document-level collapsed and drawer state. The mobile drawer reuses the same semantic tree in an offcanvas-safe positioning context, so there is no duplicated navigation implementation.

---

**Implementation correction (2026-07-30):** To preserve exact Phoenix row geometry, the catalogue parent uses Template2's `a.nav-link.dropdown-indicator[role="button"][href="#..."]` rather than a native `button`. Its disclosure glyph is the Template2 Font Awesome `svg.svg-inline--fa.fa-caret-right`, not the CMS_2 generic chevron. Vue prevents the hash navigation and owns disclosure state; desktop and mobile trees use distinct IDs so their `aria-controls` targets never collide.

## File Structure

| File                                                      | Responsibility                                                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/components/app/Sidebar.vue`                          | Phoenix sidebar DOM, accessible parent control, submenu state, desktop/mobile rendering contexts.        |
| `src/components/ui/AppIcon.vue`                           | The existing icon registry; add the route-declared `tag` shape.                                          |

No route, permission, request, store, vendor stylesheet, or API file changes belong to this plan.

### Task 1: Establish Sidebar Behavior Contracts

**Files:**

### Task 2: Implement The Phoenix Sidebar Contract

**Template2 correction:** The original code block in this task is superseded by Template2's native hierarchy. The parent must render `div.parent-wrapper.label-1 > ul.nav.collapse.parent`, prepend `li.collapsed-nav-item-title.d-none`, place the indicator before the icon/text, and render each child as `RouterLink > div.d-flex.align-items-center > span.nav-link-text`. Vue keeps the parent as a `button` and owns `aria-expanded`/`show`; all other structural details match `public/reference/pages/demo/vertical-sidenav.html`.

**Files:**

- Modify: `src/components/app/Sidebar.vue`
- Modify: `src/components/ui/AppIcon.vue`

- [ ] **Step 1: Replace the root and navigation markup in `Sidebar.vue`**

Keep the existing `groups`, `activePath`, `parentActive`, `submenuId`, `isExpanded`, `toggleEntry`, `expandActiveEntries`, and `closeMobile` methods. Replace the template with the corrected Template2-native contract:

```vue
<template>
  <nav
    :class="[
      'navbar navbar-vertical navbar-expand-lg',
      mobile ? 'position-static top-0 w-100 h-100' : '',
    ]"
    aria-label="Điều hướng chính"
  >
    <div
      :class="[
        'collapse navbar-collapse',
        mobile ? 'show d-flex flex-column flex-grow-1 h-100' : '',
      ]"
    >
      <div class="navbar-vertical-content">
        <ul class="navbar-nav flex-column">
          <li v-for="group in groups" :key="group.key" class="nav-item">
            <template v-if="group.label">
              <p class="navbar-vertical-label">{{ group.label }}</p>
              <hr class="navbar-vertical-line" />
            </template>
            <div
              v-for="entry in group.entries"
              :key="entry.key"
              class="nav-item-wrapper"
            >
              <RouterLink
                v-if="entry.path && !entry.children"
                :to="entry.path"
                class="nav-link label-1"
                :class="{ active: activePath(entry.path) }"
                :title="collapsed ? entry.label : undefined"
                @click="closeMobile"
              >
                <span class="d-flex align-items-center">
                  <span class="nav-link-icon"
                    ><AppIcon :name="entry.icon"
                  /></span>
                  <span class="nav-link-text-wrapper"
                    ><span class="nav-link-text">{{ entry.label }}</span></span
                  >
                </span>
              </RouterLink>
              <template v-else-if="entry.children?.length">
                <button
                  type="button"
                  class="nav-link dropdown-indicator label-1 w-100 border-0 text-start"
                  :class="{
                    active: parentActive(entry),
                    collapsed: !isExpanded(entry),
                  }"
                  :aria-controls="submenuId(entry)"
                  :aria-expanded="isExpanded(entry)"
                  @click="toggleEntry(entry)"
                >
                  <span class="d-flex align-items-center">
                    <span class="nav-link-icon"
                      ><AppIcon :name="entry.icon"
                    /></span>
                    <span class="nav-link-text-wrapper"
                      ><span class="nav-link-text">{{
                        entry.label
                      }}</span></span
                    >
                    <span class="dropdown-indicator-icon-wrapper"
                      ><AppIcon class="dropdown-indicator-icon" name="chevron"
                    /></span>
                  </span>
                </button>
                <div
                  :id="submenuId(entry)"
                  class="collapse"
                  :class="{ show: isExpanded(entry) }"
                >
                  <ul class="nav collapse-inner">
                    <li
                      v-for="child in entry.children"
                      :key="child.key"
                      class="nav-item"
                    >
                      <RouterLink
                        :to="child.path || '/'"
                        class="nav-link"
                        :class="{ active: activePath(child.path || '') }"
                        @click="closeMobile"
                        ><span class="nav-link-text">{{
                          child.label
                        }}</span></RouterLink
                      >
                    </li>
                  </ul>
                </div>
              </template>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="!mobile" class="navbar-vertical-footer">
        <button
          type="button"
          class="btn navbar-vertical-toggle border-0 fw-semibold w-100 d-flex align-items-center"
          data-testid="sidebar-toggle"
          :aria-label="collapsed ? 'Mở rộng menu' : 'Thu gọn menu'"
          @click="$emit('toggle')"
        >
          <AppIcon :name="collapsed ? 'expand' : 'collapse'" />
          <span class="navbar-vertical-footer-text ms-2">Thu gọn menu</span>
        </button>
      </div>
    </div>
  </nav>
</template>
```

Use this exact import block after the change:

```ts
import { defineComponent } from "vue";
import AppIcon from "@/components/ui/AppIcon.vue";
import { authenStore } from "@/stores/app-authen";
import { visibleNavigationGroups } from "@/config/navigation";
```

- [ ] **Step 2: Add the missing `tag` shape to `AppIcon.vue`**

Insert this entry adjacent to the other 24 by 24 outline icons:

```ts
  tag: [
    { type: "path", value: "M20.59 13.41 11 23l-9.59-9.59A2 2 0 0 1 .83 12V4a2 2 0 0 1 2-2h8a2 2 0 0 1 1.41.59l8.35 8.35a1.99 1.99 0 0 1 0 2.47z" },
    { type: "circle", cx: 7, cy: 7, r: 1 },
  ],
```

### Task 3: Verify Browser Geometry And Navigation Behavior

**Files:**

- [ ] **Step 1: Add desktop submenu and rail assertions**

Append these tests to the existing `Phoenix app shell` describe block:

Run:

### Task 4: Run The Regression Quality Gates

**Files:**

- No production-file changes expected. Only make a minimal test or component correction if a command identifies a regression in this feature's scope.

- [ ] **Step 1: Run static quality gates**

Run:

Expected: each command exits with code `0`.

- [ ] **Step 2: Run responsive browser regression coverage**

Run:

Expected: all selected tests pass, with only their explicit project-filter skips. Inspect failure screenshots if any browser assertion fails; correct the Phoenix DOM contract rather than adding compensating absolute-position CSS.

- [ ] **Step 3: Visually inspect the final desktop and phone states**

Run:

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

Expected: the desktop sidebar has a consistent icon/label column, Phoenix group rhythm, blue active route, visible and rotating catalogue chevron, and no cutoff text. At phone width, the offcanvas uses the same hierarchy, expands the catalogue in place, and stays within the viewport.

## Plan Self-Review

| Specification requirement                          | Planned task                                |
| -------------------------------------------------- | ------------------------------------------- |
| Full Phoenix icon/text/disclosure/submenu contract | Tasks 1 and 2                               |
| `tag` fallback correction                          | Tasks 1 and 2                               |
| Desktop width, active hierarchy, collapsed rail    | Task 3                                      |
| Mobile drawer behavior and no duplicate tree       | Tasks 1, 2, and 3                           |
| Accessibility for parent menu state                | Tasks 1 and 2                               |
| No route/permission/API changes                    | File boundaries and Task 4 regression gates |
| Type, lint, unit, responsive verification          | Task 4                                      |

The plan has no placeholders, no Git actions, and no undeclared dependency or API change. All component identifiers and state methods referenced here already exist, except the explicit new tests and `tag` icon shape defined above.
