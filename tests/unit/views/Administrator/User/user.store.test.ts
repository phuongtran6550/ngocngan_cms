import { createPinia, setActivePinia } from "pinia";
import { vi } from "vitest";
import { roleService } from "@/views/Administrator/Roles/service";
import { userService } from "@/views/Administrator/User/service";
import { useUserStore } from "@/views/Administrator/User/store";

describe("user store", () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.restoreAllMocks());

  it("refreshes the list after create without sending edit-only fields", async () => {
    const store = useUserStore();
    store.editing = {
      id: "user-1",
      name: "Nguyễn An",
      username: "an",
      role: "USER",
      roleId: "role-1",
      assignedRole: { id: "role-1", name: "Bán hàng", description: "", permissions: [] },
      permissions: [],
      createdAt: "",
      updatedAt: "",
    };
    const update = vi.spyOn(userService, "update").mockResolvedValue({ id: "user-1" } as never);
    const load = vi.spyOn(store, "load").mockResolvedValue();

    await store.save({ name: "Nguyễn An", username: "an", password: "", role: "USER", roleId: "" });

    expect(update).toHaveBeenCalledWith("user-1", { name: "Nguyễn An", role: "USER", roleId: null });
    expect(load).toHaveBeenCalled();
  });

  it("sends a replacement password only when the administrator enters one", async () => {
    const store = useUserStore();
    store.editing = {
      id: "user-1",
      name: "Nguyễn An",
      username: "an",
      role: "USER",
      roleId: "role-1",
      assignedRole: { id: "role-1", name: "Bán hàng", description: "", permissions: [] },
      permissions: [],
      createdAt: "",
      updatedAt: "",
    };
    const update = vi.spyOn(userService, "update").mockResolvedValue({ id: "user-1" } as never);
    vi.spyOn(store, "load").mockResolvedValue();

    await store.save({
      name: "Nguyễn An",
      username: "an",
      password: "secret123",
      role: "USER",
      roleId: "role-1",
    });

    expect(update).toHaveBeenCalledWith("user-1", {
      name: "Nguyễn An",
      password: "secret123",
      role: "USER",
      roleId: "role-1",
    });
  });

  it("loads role options from the shared role service only once", async () => {
    const store = useUserStore();
    const options = vi.spyOn(roleService, "options").mockResolvedValue([{ id: "role-1", name: "Bán hàng" }] as never);

    await store.loadRoleOptions();
    await store.loadRoleOptions();

    expect(options).toHaveBeenCalledTimes(1);
    expect(store.roleOptions).toEqual([{ id: "role-1", name: "Bán hàng" }]);
  });
});
