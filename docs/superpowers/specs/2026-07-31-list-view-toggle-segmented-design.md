# List View Toggle Segmented Design

## Summary

Redesign the shared ListLayout view switch as a single segmented control with two labeled options:

- `Bảng` for the DataTable renderer.
- `Thẻ` for the Card Grid renderer.

The control keeps the existing local view switching, responsive defaults, per-resource persistence, and renderer behavior unchanged. This change is presentation-only for the view switch.

## Problem

The current icon-only buttons read as two unrelated actions and require users to infer the meaning of the table and grid icons. The active state is also not visually grouped strongly enough with the inactive state. This is especially ambiguous on mobile, where the control is a primary way to understand how the list can be browsed.

## Goals

- Make the two choices read as one mutually exclusive view selector.
- Expose the view names visibly as `Bảng` and `Thẻ`.
- Make the active choice clear without using a heavy dark block.
- Keep the control compact beside filters and list actions.
- Preserve keyboard access, screen-reader state, tooltips, and current test IDs.
- Keep the control usable at desktop and mobile breakpoints without horizontal overflow.

## Non-Goals

- Changing DataTable or Card Grid content, spacing, card backgrounds, pagination, or API behavior.
- Changing responsive defaults or localStorage persistence.
- Adding navigation or a page reload when switching views.
- Adding a third view or a resource-specific toggle implementation.

## Approved Visual Direction: Option A

`ListShell.vue` renders a compact segmented control:

```text
      [  icon  Bảng  ][  icon  Thẻ  ]
```

- Outer surface: subtle tertiary-background tint, 1px translucent border, 10px radius, and 3px internal padding.
- Each option: real `button` element, 34px minimum height, 7px radius, centered icon and label, 7px icon-label gap.
- Active option: white surface, primary blue text/icon, and a restrained shadow to lift it from the outer surface.
- Inactive option: transparent surface, secondary text/icon color; hover adds a soft body-color tint.
- Focus: visible primary-colored focus ring on keyboard focus.
- Icons: 16px table/grid glyphs from the existing `AppIcon` registry.
- Labels: visible `Bảng` and `Thẻ`; no label is hidden at the mobile breakpoint.

The control remains a secondary toolbar action. The page's `Thêm mới` button remains the primary action.

## Behavior and Accessibility

- Keep `role="group"` and `aria-label="Chế độ hiển thị danh sách"` on the wrapper.
- Keep `aria-label`, `aria-pressed`, `title`, `data-testid`, and click handlers on each button.
- `aria-pressed="true"` identifies the active mode; the two buttons remain independently focusable.
- Clicking either option calls the existing `setViewMode` method and does not emit pagination events.
- The current mode still persists under `ngoc-chau:list-view:<resource-key>`.
- View resolution remains: saved preference, otherwise grid below 768px and table at 768px or wider.

## Responsive Rules

- Desktop: retain the intrinsic compact width and keep the control aligned with the list tools.
- Mobile: allow the control to keep its intrinsic width; labels remain visible and must not wrap.
- The surrounding toolbar may wrap naturally with the existing `flex-wrap` behavior; the control itself must not stretch to full width.
- The control must not increase document width beyond the viewport.

## Implementation Boundaries

- Modify only the view-toggle markup and scoped styles in `src/components/ListLayout/ListShell.vue`.
- Reuse the existing `viewOptions`, `AppIcon`, `setViewMode`, and data-test IDs.

## Verification

- Typecheck, ESLint, focused Prettier, and production build pass.

## Review Checklist

- [x] The selected direction is the labeled segmented control from visual option A.
- [x] No production behavior outside view-toggle presentation changes.
- [x] Existing accessibility and persistence contracts remain explicit.
- [x] Mobile labels remain visible and do not rely on tooltips alone.
