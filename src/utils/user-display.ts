import type { AuthUser } from "@/views/Account/types";

export function userInitials(displayName?: string, fallback = "NC"): string {
  const initials = String(displayName || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || fallback;
}

export function accountRoleLabel(user?: AuthUser | null): string {
  if (user?.assignedRole?.name) return user.assignedRole.name;
  if (user?.role === "ADMINISTRATOR") return "Quản trị viên";
  if (user?.role === "USER") return "Nhân sự";
  return "Chưa gán vai trò";
}
