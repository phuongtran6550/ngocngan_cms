# Dashboard Command Center Design

## Goal

Rebuild the CMS Dashboard as a full management command center for the business owner. The default view shows today's status plus the latest 30-day operating window, with KPI comparisons against the previous 30 days.

## Approved Direction

Use the Command Center layout:

- Top header with timeframe context and export action.
- KPI row for revenue, returns, estimated net revenue, today's orders, new customers, and warehouse stock.
- Main professional chart area for daily sales, returns, estimated net revenue, and order volume.
- Side panels for management alerts and transaction mix.
- Lower panels for top customers, top sources of goods, inventory insight, and recent orders.

## Data Scope

The Dashboard should use real data from the existing MongoDB collections:

- `Order`: sales, returns, order counts, recent activity.
- `Customer`: customer count, new customers, top customer totals where possible.
- `SourceOfGood`: source count, new sources, top source totals.
- `WarehousedGood`: stock count, warehouse value, recent high-value items.

The API should exclude removed orders with `isRemoved: true`.

## Reporting Windows

- `today`: local business day in Vietnam.
- `currentWindow`: latest 30 days ending today.
- `previousWindow`: the 30 days before `currentWindow`.

KPI trend values compare `currentWindow` against `previousWindow`.

## API Design

Add a new endpoint:

- `GET /api/dashboard/overview`

Response shape:

```json
{
  "period": {
    "today": "2026-06-02",
    "current": { "from": "2026-05-04", "to": "2026-06-02" },
    "previous": { "from": "2026-04-04", "to": "2026-05-03" }
  },
  "summary": {
    "totalSell": 0,
    "totalReturn": 0,
    "netRevenue": 0,
    "sellOrders": 0,
    "returnOrders": 0,
    "returnRate": 0,
    "todayOrders": 0,
    "newCustomers": 0,
    "newSources": 0,
    "inventoryItems": 0,
    "inventoryValue": 0
  },
  "comparison": {
    "totalSell": 0,
    "totalReturn": 0,
    "netRevenue": 0,
    "sellOrders": 0,
    "returnOrders": 0,
    "returnRate": 0,
    "newCustomers": 0,
    "inventoryItems": 0
  },
  "dailySeries": [
    {
      "date": "2026-06-02",
      "sell": 0,
      "returns": 0,
      "netRevenue": 0,
      "sellOrders": 0,
      "returnOrders": 0
    }
  ],
  "transactionMix": [
    { "label": "Bán hàng", "value": 0 },
    { "label": "Đổi trả", "value": 0 }
  ],
  "topCustomers": [],
  "topSources": [],
  "inventoryHighlights": [],
  "recentOrders": [],
  "alerts": []
}
```

## Frontend Design

Replace `CMS/src/views/dashboard/Dashboard.vue` with a structured Vue 3 dashboard that:

- Uses `vue3-apexcharts` through the existing ApexCharts dependency.
- Keeps all dashboard-specific formatting and computed data inside the view unless extraction becomes necessary.
- Uses existing `Icon`, `api`, `apiMessage`, and Ngoc Chau CSS conventions.
- Shows loading, error, empty, and populated states without layout jumps.
- Keeps the existing CSV export behavior.

## Components And Layout

The view can remain a single page-level component for this implementation because the Dashboard is one contained feature. Use clear internal computed values and helper functions for:

- Money formatting.
- Percent/trend formatting.
- Chart options.
- Empty-data detection.
- Alert icon/status mapping.

CSS should live in `CMS/src/assets/ngocchau.css` with dashboard-scoped class names.

## Error Handling

- If `/dashboard/overview` fails, show the existing alert style and keep the layout from crashing.
- If chart data is empty, render an empty panel message instead of a blank chart.
- If export fails, show the API error message in the Dashboard error area.
- Numeric values should default to `0`.

## Testing And Verification

Backend:

- Add API/service tests for period boundaries, KPI totals, comparison percentages, daily series, and removed-order exclusion.
- Run API tests.

Frontend:

- Build the CMS to verify Vue/ApexCharts integration.
- Manually inspect the Dashboard in desktop and mobile widths after running local dev servers.

## Non-Goals

- No new database schema changes.
- No role or permission changes.
- No live websocket updates.
- No advanced date picker beyond the default today plus 30-day window.
