# ListLayout ALL Summary Toolbar Design

## Summary

Use the empty left side of the shared ListLayout toolbar for a compact total-record summary while keeping the view selector aligned on the right.

```text
ALL (total)                                      [ Bảng ][ Thẻ ]
```

The total comes directly from `pagination.total`. This is a presentation-only change and does not add a filter, API request, or new state.

## Approved Direction

- Render `ALL` as the primary label and the current total inside parentheses.
- Use `pagination.total` as the single source of truth.
- Treat the summary as informational, not clickable.
- Keep the existing `Bảng / Thẻ` segmented control on the right.
- Preserve optional filters and action slots between the left summary and right view selector.
- Preserve the existing status-tab row when a resource defines tabs.

## Visual Style

- `ALL`: body text color, 14px, bold.
- Count: tertiary text color, 14px, semibold.
- Summary height aligns visually with the segmented view control.
- No card, border, filled background, or additional button treatment around the summary.
- The summary should read as the active overview label from the reference, without implying that it can be clicked.

## Responsive Behavior

- Desktop/tablet: summary stays on the left; action slot and view selector stay on the right.
- Mobile: the toolbar may wrap, but the summary remains before filters and the view selector remains right-aligned when space permits.
- The summary label and count must not wrap internally.
- The toolbar must not increase page width beyond the viewport.

## Accessibility

- Add `aria-label="Tổng số bản ghi: <total>"` so the English visual label remains understandable in the Vietnamese application.
- Do not add button, tab, or link semantics because the summary has no interaction.

## Implementation Boundaries

- Modify the toolbar markup and scoped styles in `src/components/ListLayout/ListShell.vue`.
- Reuse `pagination.total`; do not add a new prop or computed count.
- Keep DataTable, Card Grid, tabs, filters, pagination, view persistence, and Card Grid surface behavior unchanged.

## Verification

