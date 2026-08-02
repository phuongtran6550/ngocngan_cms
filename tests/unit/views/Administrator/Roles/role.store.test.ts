import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { roleService } from "@/views/Administrator/Roles/service";
import { useRoleStore } from "@/views/Administrator/Roles/store";

const systemRole = {
  id: "system-role",
  name: "Quản trị viên",
  description: "Vai trò hệ thống",
  permissions: [],
  systemRole: "ADMINISTRATOR" as const,
  isSystem: true,
  assignedUserCount: 1,
};

describe("role store", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.restoreAllMocks());

  it("prevents protected system-role actions before calling the API", () => {
    const store = useRoleStore();

    store.openEdit(systemRole);
    store.requestDelete(systemRole);

    expect(store.drawerOpen).toBe(false);
    expect(store.deleteTarget).toBeNull();
    expect(store.error).toContain("vai trò hệ thống");
  });

  it("does not open deletion confirmation for an assigned custom role", () => {
    const store = useRoleStore();
    const assignedRole = {
      ...systemRole,
      id: "custom-role",
      name: "Bán hàng",
      isSystem: false,
      assignedUserCount: 3,
    };

    store.requestDelete(assignedRole);

    expect(store.deleteTarget).toBeNull();
    expect(store.error).toContain("3 nhân sự");
  });

  it("keeps an assigned role visible when deletion is rejected", async () => {
    const store = useRoleStore();
    const role = { ...systemRole, id: "custom-role", name: "Bán hàng", isSystem: false, assignedUserCount: 3 };
    store.items = [role];
    store.deleteTarget = role;
    vi.spyOn(roleService, "remove").mockRejectedValue({
      message: "Vai trò đang được sử dụng",
      code: "ROLE_IN_USE",
      errors: { assignedUserCount: 3 },
    });

    await store.confirmDelete();

    expect(store.items).toHaveLength(1);
    expect(store.error).toContain("3 nhân sự");
  });
});
