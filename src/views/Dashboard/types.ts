export type DashboardPreset =
  | "today"
  | "last7Days"
  | "last30Days"
  | "currentMonth"
  | "previousMonth"
  | "custom";

export interface DashboardQuery {
  preset: DashboardPreset;
  from?: string;
  to?: string;
}

export interface DashboardMetric {
  value: number;
  previousValue: number;
  changePercent: number;
}

export interface DashboardSeriesPoint {
  date: string;
  sales: number;
  returns: number;
  net: number;
  orders: number;
}

export interface DashboardPeriod {
  preset?: DashboardPreset;
  timezone: string;
  days?: number;
  from?: string;
  to?: string;
  previousFrom?: string;
  previousTo?: string;
  label?: string;
  comparisonLabel?: string;
  currentStart?: string;
  currentEnd?: string;
  previousStart?: string;
  previousEnd?: string;
  end?: string;
  todayStart?: string;
}

export interface DashboardAlert {
  key: string;
  title: string;
  value: number;
  path: string;
}

export interface DashboardCustomerRanking {
  id: string;
  name: string;
  phone: string;
  value: number;
  orders: number;
}

export interface DashboardSourceRanking {
  id: string;
  name: string;
  phone: string;
  value: number;
  items: number;
}

export interface DashboardInventoryRanking {
  id: string;
  name: string;
  code: string;
  thumbnail?: string;
  importPrice: number;
  inventoryValue?: number;
  stock: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderCode?: string;
  name: string;
  phone: string;
  price: number;
  status: string;
  thumbnail?: string;
  createdAt?: string;
  activityAt?: string;
}

export interface DashboardOverview {
  period: DashboardPeriod;
  kpis: Record<string, DashboardMetric>;
  dailySeries: DashboardSeriesPoint[];
  transactionMix: { completed: number; returned: number; cancelled: number };
  alerts: DashboardAlert[];
  topCustomers: DashboardCustomerRanking[];
  topSources: DashboardSourceRanking[];
  highValueInventory: DashboardInventoryRanking[];
  recentOrders: DashboardRecentOrder[];
}
