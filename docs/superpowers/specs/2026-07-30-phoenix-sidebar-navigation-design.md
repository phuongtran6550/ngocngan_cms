# Phoenix Sidebar Navigation Design

**Status:** Desktop hierarchy remains approved. The mobile offcanvas decision is superseded by `Version2/docs/superpowers/specs/2026-08-01-template2-mobile-navigation-design.md`, which restores Template2's native root navbar collapse.

**Goal:** Rebuild the CMS_2 sidebar menu around the Phoenix v1.24.0 vertical-navigation contract so navigation rows, group headings, active states, nested catalog entries, collapsed mode, and the mobile drawer behave as one coherent template system.

## Context And Root Cause

The pre-refactor sidebar already imported Phoenix and applied several Phoenix class names, but it did not render the DOM structure that Phoenix styles target. This was a structural mismatch rather than a spacing-only defect.

Evidence from the pre-refactor implementation:

- `src/components/app/Sidebar.vue` emits a `dropdown-indicator` class but omits the required `dropdown-indicator-icon-wrapper` and rotating `dropdown-indicator-icon`; the catalogue parent has no visible or aligned disclosure affordance.
- The parent link never receives Phoenix's `collapsed` class. The template's active-parent color selectors therefore cannot distinguish closed active parents from open parents.
- Child links render text directly rather than inside a `nav-link-text` element. Phoenix cannot apply its nested-row text alignment or collapsed-state behavior consistently.
- The desktop shell uses Phoenix's `navbar-expand-lg` breakpoint and the option store correctly toggles `html.navbar-vertical-collapsed`, but the sidebar markup is incomplete for the corresponding collapsed hover behavior.
- `navigation.ts` declares the parent icon as `tag`, while `AppIcon.vue` does not define that icon and silently falls back to `grid`. This makes the catalogue row visually accidental.

The supplied screenshot is treated as a symptom report: headings, icon columns, labels, active state, and group rhythm must align predictably. It is not a replacement visual system. `Template2/public/reference/pages/demo/vertical-sidenav.html` is the exact DOM reference; Phoenix v1.24.0 remains the owner of geometry and interaction styling.

## Scope

### In Scope

- Desktop sidebar menu composition in `Sidebar.vue`.
- The identical navigation information hierarchy in `MobileNavDrawer.vue` through the shared sidebar component.
- Phoenix-compatible icon, label, disclosure, submenu, active, and collapsed markup.
- The missing `tag` icon in `AppIcon.vue`.
- Focused unit, architecture, and Playwright coverage for navigation anatomy and behavior.

### Out Of Scope

- Changes to routes, route metadata, group order, permissions, API calls, stores other than preserving their existing sidebar state contract, or global search.
- Dynamic server menus, notification badges, menu personalization, new dependencies, or replacement of the Phoenix stylesheet.
- A redesign of the header, content canvas, dashboard, or unrelated page components.
- Replacing the mobile drawer overlay implementation; its existing focus and Escape behavior remain the owner of drawer dismissal.

## Selected Design: Phoenix-Native Hierarchy

### Visual System

The desktop sidebar keeps Phoenix's existing `navbar navbar-vertical navbar-expand-lg` shell. At the existing large-desktop breakpoint, Phoenix owns:

- the `15.875rem` sidebar width;
- each direct-row horizontal margin and `0.5rem` corner radius;
- a stable icon column through `.nav-link-icon` (`min-width: 16px`);
- uppercase group labels and their `2rem` left inset;
- direct-menu vertical padding, hover background, active blue, and nested child indentation;
- the `4rem` sidebar footer and the `4rem` collapsed rail.

CMS_2 will not add a competing spacing scale or hard-code screenshot coordinates. Only narrow layout support required for the drawer context may be added, and it must consume the Phoenix variables and class anatomy rather than re-specify colors, type, or row dimensions.

### Desktop DOM Contract

The relevant hierarchy becomes:

```text
nav.navbar.navbar-vertical.navbar-expand-lg
  div.collapse.navbar-collapse
    div.navbar-vertical-content
      ul.navbar-nav.flex-column
        li (one rendered group)
          p.navbar-vertical-label (when the group has a label)
          hr.navbar-vertical-line
          div.nav-item-wrapper (one top-level entry)
            RouterLink.nav-link.label-1 (leaf entry)
              div.d-flex.align-items-center
                span.nav-link-icon > AppIcon
                span.nav-link-text-wrapper > span.nav-link-text
            a.nav-link.dropdown-indicator.label-1[role=button] (parent entry)
              div.d-flex.align-items-center
                div.dropdown-indicator-icon-wrapper > svg.svg-inline--fa.fa-caret-right.dropdown-indicator-icon
                span.nav-link-icon > AppIcon
                span.nav-link-text
            div.parent-wrapper.label-1
              ul.nav.collapse.parent (shown from Vue state)
                li.collapsed-nav-item-title.d-none
                li.nav-item > RouterLink.nav-link > div.d-flex.align-items-center > span.nav-link-text
```

The parent control keeps Template2's hash-anchor model: `a.nav-link.dropdown-indicator.label-1[role=button][href="#..."]`. Vue prevents the hash navigation, owns `aria-expanded`, and applies `collapsed` whenever the submenu is closed. The disclosure glyph is Template2's exact Font Awesome `fa-caret-right` SVG rather than CMS_2's generic chevron. This avoids the intrinsic sizing behavior of a native `button`, so parent rows retain the same geometry as Phoenix link rows while preserving the template's wrappers, indicator order, `parent-wrapper`, `parent`, and collapsed title.

Leaf and child links remain Vue Router links. Their `@click` behavior continues to close the mobile drawer only when rendered in mobile mode. The desktop footer remains a native button with its existing test id and label behavior.

### Data And State Flow

```text
route metadata
  -> navigation.ts groups, hierarchy, ordering, permission requirements
  -> visibleNavigationGroups(current user permissions and role)
  -> Sidebar render tree

current route
  -> activePath / parentActive
  -> active classes and initial submenu expansion

user opens or closes a parent
  -> Sidebar.expanded[entry.key]
  -> aria-expanded, collapsed class, collapse.show

user toggles desktop rail
  -> app-option store.sidebarCollapsed
  -> html.navbar-vertical-collapsed (Phoenix owner)
  -> existing app-shell compatibility class remains unchanged

user uses mobile menu
  -> app-option store.mobileNavOpen
  -> MobileNavDrawer + shared Sidebar mobile context
  -> navigation click emits close-mobile
```

No route, permission, or data ownership moves. `navigation.ts` remains the single source of menu hierarchy; `app-option.ts` remains the single source of shell state; `Sidebar.vue` owns only ephemeral expanded-parent state.

### Icon Policy

`AppIcon.vue` gains the `tag` outline icon required by the existing `catalog` navigation declaration. The icon uses the same 24 by 24 viewbox, `currentColor`, stroke width, caps, and joins as the other menu icons. No icon library or image asset is introduced. Child route icons remain data owned by route metadata but are not rendered as a second icon column inside this sidebar design.

### Responsive And Collapsed Behavior

| Context                   | Required behavior                                                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Desktop at `lg` and above | The fixed Phoenix vertical navbar is visible. Parent items disclose children; direct and child items retain a stable icon/text rhythm.                                                                                                                                               |
| Desktop collapsed         | The option store continues to place `navbar-vertical-collapsed` on `html`. Phoenix reduces the rail to `4rem`, hides row text and disclosure affordances, and exposes the contextual hover treatment only when the required wrapper markup exists.                                   |
| Below `lg`                | The desktop sidebar stays hidden by the existing shell class. The topbar opens the existing offcanvas drawer; there is no horizontal overflow and no duplicate desktop navigation.                                                                                                   |
| Mobile drawer             | The same semantic group, parent, child, active, and permission-filtered tree renders in the offcanvas. Its root is adapted to the offcanvas positioning context without copying the desktop fixed-position geometry. A leaf navigation closes the drawer; a parent expands in place. |

The implementation must keep the existing breakpoint boundary so the header and content shell continue using the matching `navbar-expand-lg` Phoenix rules. It must not substitute `navbar-expand-xs` merely to obtain a visual effect; that would make the application shell desktop-only at mobile widths and break the existing drawer contract.

### Accessibility And Interaction

- The navigation root keeps the accessible label `Điều hướng chính`.
- Parent controls use Template2-style anchors with `role="button"`, `aria-expanded`, and a unique `aria-controls` target.
- The open parent is restored automatically when the current route belongs to its child set. A manual parent state persists while navigating unrelated links during the current component lifetime.
- Leaf routes keep Vue Router's active and keyboard semantics. Mobile link activation closes the drawer after navigation is requested.
- The disclosure icon is decorative because the parent label and `aria-expanded` convey the state. `AppIcon` remains `aria-hidden`.
- Focus-visible styling is inherited from Phoenix. No click-only interaction is introduced.

## Implementation Boundaries

Expected changed files:

- `src/components/app/Sidebar.vue`: render the full Phoenix contract, Template2-style parent anchors, and context-specific IDs for the desktop and mobile trees.
- `src/components/app/MobileNavDrawer.vue`: only if the shared sidebar requires an explicit context class or prop to neutralize fixed desktop geometry in the offcanvas.
- `src/components/ui/AppIcon.vue`: add the `tag` icon definition.
- `tests/unit/components/app/Sidebar.test.ts`: add focused rendering and interaction coverage.
- `tests/architecture/phoenix-interaction-contract.test.ts` or a dedicated sidebar anatomy test: lock the Phoenix structural contract so future changes cannot regress to class-only imitation.
- `tests/e2e/app-shell.spec.ts`: extend app-shell coverage for active-parent/submenu, collapsed rail behavior, and mobile navigation close behavior.

`src/config/navigation.ts`, routes, permission config, backend service code, and the Phoenix vendor stylesheet are intentionally not modified for this work.

## Verification Plan

### Unit And Architecture Tests

1. Render a permitted leaf and assert it has the Phoenix icon/text wrapper structure and an active class on its current route.
2. Render the catalogue parent and assert the Template2-style anchor has a disclosure wrapper, `aria-controls`, correct `aria-expanded`, and `collapsed` when closed.
3. Mount on a catalogue child route and assert its parent starts expanded, its parent is active, and the matching child is active.
4. Toggle the parent and assert Vue state updates `aria-expanded`, `collapsed`, and `collapse.show` together.
5. Render mobile mode, click a leaf, and assert one `close-mobile` event. Confirm a parent click expands rather than closing the drawer.
6. Assert `tag` renders as its own AppIcon shape rather than falling back to `grid`.
7. Add a static Phoenix contract assertion for `dropdown-indicator-icon-wrapper`, `dropdown-indicator-icon`, child `nav-link-text`, and the reactive `collapsed` class.

### Browser Tests

1. At the desktop projects, assert a `15.875rem` sidebar, the expected visible group/entry order, a blue active route, and child indentation greater than its parent row.
2. Toggle the sidebar and assert the document owns `navbar-vertical-collapsed`, the existing app-shell compatibility class remains, and the content edge follows Phoenix's compact rail rather than overflowing the viewport.
3. At the tablet and phone projects, open the mobile drawer, expand a parent, navigate through a child, and assert the drawer closes with no page errors or horizontal overflow.
4. Re-run the route and responsive matrices to verify permission-filtered menus and every authenticated route still render in the viewport.

### Quality Gates

Run the project typecheck, lint, unit tests, focused Playwright shell coverage, and the responsive matrix. Inspect desktop and mobile screenshots before reporting completion. No code change is considered complete solely because markup tests pass.

## Risks And Mitigations

| Risk                                                                   | Mitigation                                                                                                              |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Phoenix selectors are sensitive to class and nesting details.          | Lock the full wrapper/indicator/label contract in tests and let the vendored stylesheet own the visual behavior.        |
| A desktop fix leaks into the offcanvas drawer.                         | Reuse semantic navigation markup but use an explicit mobile positioning context; test both desktop and mobile projects. |
| Parent anchors diverge from the template or lose state semantics.      | Retain `role="button"` and ARIA state, and test the disclosure state instead of relying on hover alone.                 |
| A permission-filtered group creates an empty or invalid visual region. | Keep `visibleNavigationGroups` unchanged and test the filtered one-entry case.                                          |
| Icon fallback hides missing navigation metadata.                       | Add the declared `tag` shape and test it explicitly.                                                                    |

## Deliberate Non-Decisions

- The active blue continues to be Phoenix's vertical-navigation active token, not the Ngoc Chau burgundy brand token. This follows the supplied reference and avoids conflating action branding with navigation state.
- The specification does not prescribe a custom pixel value beyond values already established by Phoenix. If the vendor stylesheet upgrades in the future, the component remains aligned to its template variables rather than a copied layout.
- The sidebar remains route-metadata-derived. Manual arrays in `Sidebar.vue` are not introduced.
