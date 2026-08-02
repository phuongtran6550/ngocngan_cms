export interface ActiveRoute {
  path: string;
  heading: string;
}

export const activeRoutes: readonly ActiveRoute[] = Object.freeze([
  { path: "/dashboard", heading: "Tổng quan kinh doanh" },
  { path: "/orders", heading: "Quản lý đơn hàng" },
  { path: "/orders/create", heading: "Tạo đơn hàng" },
  { path: "/orders/missing", heading: "Đơn chờ bổ sung" },
  { path: "/orders/order-1", heading: "Nguyễn Minh Anh" },
  { path: "/customers", heading: "Khách hàng" },
  { path: "/customers/history", heading: "Lịch sử đổi trả" },
  { path: "/warehoused-goods", heading: "Hàng nhập kho" },
  { path: "/warehoused-goods/create", heading: "Thêm hàng nhập kho" },
  {
    path: "/warehoused-goods/warehouse-1",
    heading: "Nhẫn kim cương Aurora",
  },
  {
    path: "/warehoused-goods/warehouse-1/edit",
    heading: "Cập nhật hàng nhập kho",
  },
  { path: "/source-of-goods", heading: "Quản lý nguồn hàng" },
  { path: "/categories", heading: "Quản lý danh mục" },
  { path: "/materials", heading: "Quản lý chất liệu" },
  { path: "/patterns", heading: "Quản lý mẫu" },
  { path: "/roles", heading: "Quản lý vai trò" },
  { path: "/users", heading: "Quản lý nhân sự" },
  { path: "/settings", heading: "Cài đặt" },
  {
    path: "/zalo/callback?code=demo&state=oauth-state",
    heading: "Xử lý kết nối Zalo OA",
  },
  { path: "/profile", heading: "Hồ sơ cá nhân" },
  { path: "/profile/change-password", heading: "Đổi mật khẩu" },
]);
