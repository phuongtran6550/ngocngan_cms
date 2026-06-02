# Dashboard Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved owner-facing Dashboard Command Center with full operating metrics, professional charts, and real API data.

**Architecture:** Add a backend `/dashboard/overview` service that computes all management metrics from existing MongoDB collections, then replace the CMS Dashboard view with a Vue 3 page that consumes that payload and renders KPI cards, ApexCharts, alerts, rankings, inventory, and recent orders. Keep CSV export intact.

**Tech Stack:** Node.js ESM, Express, Mongoose, Node built-in test runner, Vue 3 Composition API, Vite, vue3-apexcharts, existing Ngoc Chau CSS.

---

## File Structure

- Modify `API/package.json`: add a `test` script using Node's built-in test runner.
- Create `API/Controller/DashboardController/Models/index.test.js`: service-level tests for `overviewReport`.
- Modify `API/Controller/DashboardController/Models/index.js`: add Vietnam-date helpers and `overviewReport`.
- Modify `API/Controller/DashboardController/index.js`: expose `overview`.
- Modify `API/Controller/DashboardController/Route.js`: add `GET /overview`.
- Modify `CMS/src/main.js`: register Vue ApexCharts globally.
- Replace `CMS/src/views/dashboard/Dashboard.vue`: render the Command Center UI.
- Modify `CMS/src/assets/ngocchau.css`: add dashboard-scoped responsive styles.

## Task 1: Backend Overview API

**Files:**
- Modify: `API/package.json`
- Create: `API/Controller/DashboardController/Models/index.test.js`
- Modify: `API/Controller/DashboardController/Models/index.js`
- Modify: `API/Controller/DashboardController/index.js`
- Modify: `API/Controller/DashboardController/Route.js`

- [ ] **Step 1: Add the failing service test**

Create `API/Controller/DashboardController/Models/index.test.js` with Node's test runner. The test imports `overviewReport`, stubs model methods, calls `overviewReport(new Date('2026-06-02T05:00:00.000Z'))`, and asserts:

```js
assert.equal(result.period.today, '2026-06-02');
assert.deepEqual(result.period.current, { from: '2026-05-04', to: '2026-06-02' });
assert.deepEqual(result.period.previous, { from: '2026-04-04', to: '2026-05-03' });
assert.equal(result.summary.totalSell, 1000000);
assert.equal(result.summary.totalReturn, 250000);
assert.equal(result.summary.netRevenue, 750000);
assert.equal(result.summary.sellOrders, 1);
assert.equal(result.summary.returnOrders, 1);
assert.equal(result.summary.todayOrders, 1);
assert.equal(result.summary.inventoryItems, 2);
assert.equal(result.summary.inventoryValue, 1800000);
assert.equal(result.comparison.totalSell, 100);
assert.equal(result.dailySeries.length, 30);
assert.equal(result.dailySeries[0].date, '2026-05-04');
assert.equal(result.dailySeries[29].date, '2026-06-02');
```

- [ ] **Step 2: Add `npm test` script**

Update `API/package.json`:

```json
"test": "node --test"
```

- [ ] **Step 3: Verify RED**

Run:

```bash
cd API && npm test -- Controller/DashboardController/Models/index.test.js
```

Expected: FAIL because `overviewReport` is not exported yet.

- [ ] **Step 4: Implement overview service and route**

Add `overviewReport(now = new Date())` to `API/Controller/DashboardController/Models/index.js`. It must:

- Compute Vietnam-local `today`, current 30-day window, and previous 30-day window.
- Exclude removed orders with `isRemoved: true`.
- Return `summary`, `comparison`, `dailySeries`, `transactionMix`, `topCustomers`, `topSources`, `inventoryHighlights`, `recentOrders`, and `alerts`.
- Use safe numeric defaults and stable array shapes.

Expose it through:

```js
export const overview = asyncHandler(async (req, res) => {
  res.json(await dashboardService.overviewReport());
});
```

and route:

```js
dashboardRouter.get('/overview', controller.overview);
```

- [ ] **Step 5: Verify GREEN**

Run:

```bash
cd API && npm test -- Controller/DashboardController/Models/index.test.js
```

Expected: PASS.

## Task 2: CMS Dashboard Command Center

**Files:**
- Modify: `CMS/src/main.js`
- Replace: `CMS/src/views/dashboard/Dashboard.vue`
- Modify: `CMS/src/assets/ngocchau.css`

- [ ] **Step 1: Register ApexCharts**

Update `CMS/src/main.js`:

```js
import VueApexCharts from 'vue3-apexcharts';

createApp(App).use(createPinia()).use(router).use(VueApexCharts).mount('#app');
```

- [ ] **Step 2: Replace Dashboard view**

Replace `CMS/src/views/dashboard/Dashboard.vue` with a Vue 3 Composition API view that:

- Fetches `/dashboard/overview` on mount.
- Keeps existing CSV export with `/export/orders`.
- Displays six KPI cards with trend percentages.
- Renders an Apex mixed chart for daily sales, returns, net revenue, and order count.
- Renders an Apex donut chart for transaction mix.
- Shows management alerts, top customers, top sources, inventory highlights, and recent orders.
- Shows loading, error, and empty states.

- [ ] **Step 3: Add dashboard styles**

Append dashboard-scoped CSS in `CMS/src/assets/ngocchau.css` for:

- `.dashboard-command`
- `.dashboard-kpi-grid`
- `.dashboard-chart-grid`
- `.dashboard-panel`
- `.dashboard-list`
- `.dashboard-alert`
- responsive breakpoints for mobile/tablet/desktop.

- [ ] **Step 4: Verify frontend build**

Run:

```bash
cd CMS && npm run build
```

Expected: Vite build exits with code 0.

## Task 3: Full Verification

**Files:**
- No new files unless a verification issue requires a focused fix.

- [ ] **Step 1: Run backend tests**

Run:

```bash
cd API && npm test
```

Expected: all Node tests pass.

- [ ] **Step 2: Run CMS build**

Run:

```bash
cd CMS && npm run build
```

Expected: Vite build exits with code 0.

- [ ] **Step 3: Review changed files**

Run:

```bash
git -C API status --short
git -C CMS status --short
```

Expected: only Dashboard/API feature files plus pre-existing user changes are shown.
