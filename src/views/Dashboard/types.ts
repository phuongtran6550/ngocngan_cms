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

export interface DashboardOverview {
  period: { timezone: string; currentStart?: string; previousStart?: string; end?: string; todayStart?: string };
  kpis: Record<string, DashboardMetric>;
  dailySeries: DashboardSeriesPoint[];
  transactionMix: { completed: number; returned: number; cancelled: number };
  alerts: Array<{ key: string; title: string; value: number; path: string }>;
  topCustomers: Array<{ id: string; name: string; phone: string; value: number; orders: number }>;
  topSources: Array<{ id: string; name: string; phone: string; value: number; items: number }>;
  highValueInventory: Array<{ id: string; name: string; code: string; thumbnail?: string; importPrice: number; stock: number }>;
  recentOrders: Array<{ id: string; name: string; phone: string; price: number; status: string; thumbnail?: string; createdAt?: string }>;
}
