# Phoenix Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. This repository has an explicit no-Git-command rule: do not run Git commands or create commits. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the structurally incomplete sidebar with the Phoenix v1.24.0 navigation tree shipped in Template2, aligning icons, labels, headings, active states, submenu disclosure, collapsed rail behavior, and the mobile drawer.

**Architecture:** `Template2/public/reference/pages/demo/vertical-sidenav.html` defines the DOM contract. `navigation.ts` remains the source of route-derived groups, ordering, and authorization; `Sidebar.vue` owns only ephemeral submenu state and renders the Template2-native wrappers; `app-option.ts` continues to own document-level collapsed and drawer state. The mobile drawer reuses the same semantic tree in an offcanvas-safe positioning context, so there is no duplicated navigation implementation.

**Tech Stack:** Vue 3 Options API, Vue Router 4, Pinia, Phoenix v1.24.0 CSS, Bootstrap 5, Vitest, Vue Test Utils, Playwright.

---

**Implementation correction (2026-07-30):** To preserve exact Phoenix row geometry, the catalogue parent uses Template2's `a.nav-link.dropdown-indicator[role="button"][href="#..."]` rather than a native `button`. Its disclosure glyph is the Template2 Font Awesome `svg.svg-inline--fa.fa-caret-right`, not the CMS_2 generic chevron. Vue prevents the hash navigation and owns disclosure state; desktop and mobile trees use distinct IDs so their `aria-controls` targets never collide.

## File Structure

| File                                                      | Responsibility                                                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/components/app/Sidebar.vue`                          | Phoenix sidebar DOM, accessible parent control, submenu state, desktop/mobile rendering contexts.        |
| `src/components/ui/AppIcon.vue`                           | The existing icon registry; add the route-declared `tag` shape.                                          |
| `tests/unit/components/app/Sidebar.test.ts`               | Isolated DOM, ARIA, active-route, and event behavior of the sidebar.                                     |
| `tests/unit/components/ui/AppIcon.test.ts`                | Protect the new tag shape from silently falling back to the grid icon.                                   |
| `tests/architecture/phoenix-interaction-contract.test.ts` | Static guard for the required Phoenix sidebar structure.                                                 |
| `tests/e2e/app-shell.spec.ts`                             | Real browser checks for desktop geometry, collapsed rail, submenu navigation, and mobile drawer closure. |

No route, permission, request, store, vendor stylesheet, or API file changes belong to this plan.

### Task 1: Establish Sidebar Behavior Contracts

**Files:**

- Create: `tests/unit/components/app/Sidebar.test.ts`
- Create: `tests/unit/components/ui/AppIcon.test.ts`
- Modify: `tests/architecture/phoenix-interaction-contract.test.ts`

- [ ] **Step 1: Write the failing Sidebar unit tests**

```ts
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Sidebar from "@/components/app/Sidebar.vue";
import { authenStore } from "@/stores/app-authen";

const StubPage = { template: "<div />" };

async function mountSidebar(path = "/warehoused-goods", mobile = false) {
  setActivePinia(createPinia());
  const auth = authenStore();
  auth.user = { role: "ADMINISTRATOR", permissions: [] };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/dashboard", component: StubPage },
      { path: "/categories", component: StubPage },
      { path: "/materials", component: StubPage },
      { path: "/patterns", component: StubPage },
      { path: "/warehoused-goods", component: StubPage },
    ],
  });
  await router.push(path);
  await router.isReady();
  return mount(Sidebar, { props: { mobile }, global: { plugins: [router] } });
}

describe("AppSidebar", () => {
  it("renders Phoenix icon, text, and active-link anatomy", async () => {
    const wrapper = await mountSidebar();
    const warehouse = wrapper.get('a[href="/warehoused-goods"]');

    expect(warehouse.classes()).toEqual(
      expect.arrayContaining(["nav-link", "label-1", "active"]),
    );
    expect(warehouse.find(".nav-link-icon > svg.cms-icon").exists()).toBe(true);
    expect(
      warehouse.find(".nav-link-text-wrapper > .nav-link-text").text(),
    ).toBe("Hàng nhập kho");
  });

  it("opens an active catalogue parent with Phoenix disclosure anatomy", async () => {
    const wrapper = await mountSidebar("/materials");
    const catalog = wrapper.get('button[aria-controls="sidebar-catalog"]');

    expect(catalog.attributes("aria-expanded")).toBe("true");
    expect(catalog.classes()).toEqual(
      expect.arrayContaining([
        "nav-link",
        "dropdown-indicator",
        "label-1",
        "active",
      ]),
    );
    expect(catalog.classes()).not.toContain("collapsed");
    expect(
      catalog
        .find(".dropdown-indicator-icon-wrapper > .dropdown-indicator-icon")
        .exists(),
    ).toBe(true);
    expect(wrapper.get("#sidebar-catalog").classes()).toContain("show");
    expect(wrapper.get('a[href="/materials"]').classes()).toContain("active");
  });

  it("keeps ARIA state, collapsed class, and collapse class in sync", async () => {
    const wrapper = await mountSidebar("/dashboard");
    const catalog = wrapper.get('button[aria-controls="sidebar-catalog"]');

    expect(catalog.attributes("aria-expanded")).toBe("false");
    expect(catalog.classes()).toContain("collapsed");
    await catalog.trigger("click");
    expect(catalog.attributes("aria-expanded")).toBe("true");
    expect(catalog.classes()).not.toContain("collapsed");
    expect(wrapper.get("#sidebar-catalog").classes()).toContain("show");
  });

  it("uses the same tree in the mobile context and closes only after leaf navigation", async () => {
    const wrapper = await mountSidebar("/dashboard", true);
    const catalog = wrapper.get('button[aria-controls="sidebar-catalog"]');

    expect(
      wrapper.get("nav.navbar-vertical.position-static.w-100").exists(),
    ).toBe(true);
    await catalog.trigger("click");
    expect(wrapper.emitted("close-mobile")).toBeUndefined();
    await wrapper.get('a[href="/categories"]').trigger("click");
    expect(wrapper.emitted("close-mobile")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Write the failing icon and static-contract tests**

```ts
// tests/unit/components/ui/AppIcon.test.ts
import { mount } from "@vue/test-utils";
import AppIcon from "@/components/ui/AppIcon.vue";

it("renders the route-declared tag glyph instead of the grid fallback", () => {
  const tag = mount(AppIcon, { props: { name: "tag" } });
  const grid = mount(AppIcon, { props: { name: "grid" } });

  expect(tag.html()).not.toBe(grid.html());
  expect(tag.get("svg").attributes("viewBox")).toBe("0 0 24 24");
});

// append to tests/architecture/phoenix-interaction-contract.test.ts
it("renders the complete Phoenix sidebar disclosure contract", () => {
  const source = readFileSync(
    resolve(sourceRoot, "components/app/Sidebar.vue"),
    "utf8",
  );

  expect(source).toContain("dropdown-indicator label-1");
  expect(source).toContain('class="dropdown-indicator-icon-wrapper"');
  expect(source).toContain('class="dropdown-indicator-icon"');
  expect(source).toContain('class="nav-link-text"');
  expect(source).toContain("collapsed: !isExpanded(entry)");
  expect(source).toContain('type="button"');
});
```

- [ ] **Step 3: Run the focused tests and confirm the baseline fails**

Run:

```bash
npx vitest run tests/unit/components/app/Sidebar.test.ts tests/unit/components/ui/AppIcon.test.ts tests/architecture/phoenix-interaction-contract.test.ts
```

Expected: the command fails because `Sidebar.test.ts` and `AppIcon.test.ts` do not yet exist; after creating them, the Sidebar assertions fail on the missing disclosure wrapper, reactive `collapsed` class, mobile Phoenix root, and `tag` shape.

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

- [ ] **Step 3: Run unit and architecture tests to verify the implementation passes**

Run:

```bash
npx vitest run tests/unit/components/app/Sidebar.test.ts tests/unit/components/ui/AppIcon.test.ts tests/architecture/phoenix-interaction-contract.test.ts tests/unit/config/navigation.test.ts tests/unit/AppComposition.test.ts
```

Expected: PASS. If a mobile-root assertion fails because class order differs, assert class membership rather than an exact serialized class string; do not relax the Phoenix class requirements.

### Task 3: Verify Browser Geometry And Navigation Behavior

**Files:**

- Modify: `tests/e2e/app-shell.spec.ts`

- [ ] **Step 1: Add desktop submenu and rail assertions**

Append these tests to the existing `Phoenix app shell` describe block:

```ts
test("uses Phoenix sidebar geometry and keeps the active catalogue hierarchy aligned", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(!["desktop-1440", "desktop-1280"].includes(testInfo.project.name));
  await page.goto("/materials");

  const sidebar = page.locator("nav.navbar-vertical.navbar-expand-lg");
  const catalog = sidebar.getByRole("button", { name: "Danh mục" });
  const material = sidebar.locator('a[href="/materials"]');
  const parentBox = await catalog.boundingBox();
  const childBox = await material.boundingBox();
  const metrics = await sidebar.evaluate((element) => ({
    width: Math.round(element.getBoundingClientRect().width),
    activeColor: getComputedStyle(
      element.querySelector('a[href="/materials"]')!,
    ).color,
  }));

  expect(metrics).toEqual({ width: 254, activeColor: "rgb(56, 116, 255)" });
  expect(await catalog.getAttribute("aria-expanded")).toBe("true");
  expect(parentBox).not.toBeNull();
  expect(childBox).not.toBeNull();
  expect(childBox!.x).toBeGreaterThan(parentBox!.x);

  await page.getByTestId("sidebar-toggle").click();
  await expect(page.locator("html")).toHaveClass(/navbar-vertical-collapsed/);
  await expect(page.getByTestId("app-shell")).toHaveClass(
    /is-sidebar-collapsed/,
  );
});

test("expands the catalogue and closes the mobile drawer after child navigation", async ({
  authenticatedPage: page,
}, testInfo) => {
  test.skip(
    !["tablet-768", "mobile-390", "mobile-360"].includes(testInfo.project.name),
  );
  await page.goto("/dashboard");
  await page.getByTestId("mobile-nav-toggle").click();

  const drawer = page.getByTestId("mobile-nav-drawer");
  const catalog = drawer.getByRole("button", { name: "Danh mục" });
  await catalog.click();
  await expect(catalog).toHaveAttribute("aria-expanded", "true");
  await drawer.locator('a[href="/categories"]').click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.getByTestId("mobile-nav-drawer")).toHaveCount(0);
});
```

- [ ] **Step 2: Run the focused Playwright coverage**

Run:

```bash
npx playwright test tests/e2e/app-shell.spec.ts
```

Expected: PASS on the desktop, tablet, and mobile projects, with existing project-specific skips remaining expected. If the vendor stylesheet computes a fractional width, keep the `Math.round` assertion; do not replace it with a broad width range.

### Task 4: Run The Regression Quality Gates

**Files:**

- No production-file changes expected. Only make a minimal test or component correction if a command identifies a regression in this feature's scope.

- [ ] **Step 1: Run static quality gates**

Run:

```bash
npm run typecheck
npm run lint
npm run test:unit
```

Expected: each command exits with code `0`.

- [ ] **Step 2: Run responsive browser regression coverage**

Run:

```bash
npx playwright test tests/e2e/app-shell.spec.ts tests/e2e/responsive-matrix.spec.ts tests/e2e/css-stability.spec.ts
```

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
