# ListLayout Card Grid Design

## Summary

Extend the shared `ListLayout` presentation with two user-selectable views:

- `DataTable` for dense, column-oriented data.
- `Card Grid` for touch-friendly and narrow-screen data browsing.

When no saved preference exists, desktop viewports default to `DataTable` and mobile viewports default to `Card Grid`. A manual selection is stored per resource and overrides the responsive default on later visits.

## Goals

- Let users switch between table and card views without reloading data.
- Default to table at viewport widths of `768px` or wider.
- Default to card grid below `768px`.
- Persist the manual view choice separately for each `ResourceDefinition.key`.
- Reuse the existing column renderers and row actions in both views.
- Preserve filters, sorting, loading, errors, pagination, permissions, and the current page while switching views.
- Keep the feature usable and readable on mobile, tablet, and desktop.

## Non-Goals

- Changing API requests, response normalization, pagination, or filtering behavior.
- Adding a separate card-specific schema to every resource definition.
- Making the entire card clickable, which would conflict with interactive cells and action menus.
- Persisting view preferences on the server or synchronizing them between browsers.
- Automatically changing an explicit user selection when the viewport is resized.

## Existing Context

`ListLayout/index.vue` owns resource data and delegates list presentation to `ListShell.vue`. `ListShell.vue` currently renders loading, empty, error, table, and pagination states. `DataTable.vue` delegates cell formatting to `CellRenderer.vue` and row permissions/actions to `RowActionMenu.vue`.

The card grid will follow the same presentation pipeline instead of introducing card-only formatting or action logic.

## User Experience

### View Toggle

`ListShell` displays a two-button view switch modeled on Phoenix's Project Card View controls:

- Table button: table/list icon with accessible label `Hiển thị dạng bảng`.
- Grid button: card-grid icon with accessible label `Hiển thị dạng thẻ`.

The buttons are independent compact Phoenix controls rather than a segmented container. Each button is approximately 42–44px wide and 35–38px tall, uses 16px horizontal padding, a 6px radius, and a 4px gap before the next option. The unselected option uses the existing `btn-phoenix-primary` blue icon and subtle border. The selected option keeps the same surface, removes the border, and uses the normal body text color, matching `/apps/project-management/project-card-view.html`.

The controls are icon-only visually, with native `title`, explicit `aria-label`, and `aria-pressed` attributes preserving accessible names and state. They remain real buttons because switching views is local presentation state; unlike the Phoenix reference links, they do not navigate or reload the resource.

Both controls remain available at all viewport sizes and never expand to the full toolbar width. The create action remains the primary blue button in the page header while the compact view controls stay beside the list tools.

### Initial View

The initial view is resolved in this order:

1. Read the stored preference for the current `definition.key`.
2. If the saved value is `table` or `grid`, use it.
3. Otherwise, use `grid` below `768px` and `table` at `768px` or wider.

The responsive default is evaluated when the list view is initialized. Later viewport resizing does not replace an explicit manual selection.

### Persistence

Preferences use a namespaced local-storage key derived from the resource key, for example:

`ngoc-chau:list-view:categories`

Each list therefore remembers its own view. Storage reads and writes are guarded so unavailable or malformed storage never prevents the list from rendering.

## Card Grid Design

### Layout

The grid uses the chosen hierarchical-card direction:

- Mobile: one column.
- Tablet: two columns.
- Desktop: three columns.

Cards share equal-height behavior within a row where practical, but content is never clipped to force a fixed height.

### Information Hierarchy

For each row:

1. Prefer the first visible, readable text-like non-utility column (`text`, `profile`, grouped text, hyperlink, or read-state text) as the card title.
2. If no readable field exists, fall back to the first visible non-utility column.
3. Prefer a visible `status` or `badge` column in the card header.
4. Render remaining visible columns as labeled metadata, excluding `stt`; inline `action` cells remain available because they can expose resource-specific commands that are separate from the standard row menu.
5. Place the existing row-action menu in the top-right action area.

Utility columns such as `stt` and `action` do not become the title. If no suitable title column exists, fall back to the existing resource identity helper.

Metadata is displayed in a responsive internal grid. It uses two columns when space permits and collapses to one column on narrow cards. Long values wrap instead of causing horizontal page overflow.

### Cell Rendering

`ResourceCardGrid.vue` reuses `CellRenderer.vue` for displayed values. This preserves the existing behavior for:

- text and grouped text;
- status and badges;
- numbers, currency, and money;
- dates and times;
- images and profiles;
- links, copy controls, switches, tags, and registered custom cell types.

Cell action events are re-emitted using the same `{ row, column, action }` payload as `DataTable.vue`.

### Row Actions

`ResourceCardGrid.vue` uses `RowActionMenu.vue` with the same inputs as the table:

- resource-level view, update, and delete permissions;
- `canUpdateRow` and `canDeleteRow` row checks;
- the shared resource identity label;
- matching `view`, `edit`, and `delete` events.

## Component Architecture

### `useListViewMode.ts`

A focused composable owns view resolution and persistence:

- accepts a reactive resource key;
- returns the current `table | grid` mode;
- returns a setter for manual selections;
- safely reads and writes local storage;
- uses `window.matchMedia('(max-width: 767.98px)')` only when no valid preference exists.

This keeps responsive and persistence logic out of the visual components and prevents duplicate implementations across list pages.

### `ResourceCardGrid.vue`

A shared presentation component receives the same core data and action permissions as `DataTable.vue`. It computes visible columns, title/status/metadata roles, delegates value rendering, and emits existing list events.

### `ListShell.vue`

`ListShell` composes the view toggle, `DataTable`, and `ResourceCardGrid`. Loading, empty, error, and pagination remain outside the individual renderers so both modes share identical list state behavior.

No changes are required to feature pages that already use the shared `ListLayout`.

## Data Flow

1. `ListLayout` loads rows once through the existing controller.
2. `ListShell` initializes the view mode for `definition.key`.
3. The selected renderer receives the existing rows, columns, pagination values, action permissions, and row permission callbacks.
4. Switching view updates only presentation state and local storage.
5. Renderer events flow through `ListShell` using the current event names and payloads.

Switching views does not call the endpoint, reset pagination, clear filters, or replace the row collection.

## Accessibility

- Toggle buttons use explicit Vietnamese accessible labels and `aria-pressed`.
- Native titles and explicit accessible labels describe both icon-only buttons.
- The toggle group has a descriptive label for screen readers.
- Each card is a labeled `article` whose accessible name comes from its visible resource title, and cards do not create nested whole-card click targets.
- Existing interactive cell controls and action menus retain keyboard behavior.
- Visible focus styling comes from the existing Phoenix button and menu styles.
- Labels remain visible for metadata values so the card does not depend on column position for meaning.

## Error Handling

- Invalid saved values are ignored.
- Storage access errors fall back to the responsive default.
- Missing title/status columns use deterministic fallbacks.
- Unknown cell types continue through the existing cell registry fallback.
- Empty, loading, and API error states remain owned by `ListShell` and are identical in both modes.

## Acceptance Criteria

- Users can switch between DataTable and Card Grid on every standard shared ListLayout page.
- The switcher matches Phoenix Project Card View: compact independent icon buttons, blue bordered inactive state, and borderless body-color active state.
- Fresh desktop visits show DataTable by default.
- Fresh mobile visits show Card Grid by default.
- Manual selections persist per list and override later responsive defaults.
- Card Grid follows the approved hierarchical-card design.
- Table and card views expose equivalent data formatting and permitted actions.
- Switching views preserves the current data, filters, and pagination state.
