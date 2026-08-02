import { roleDefinition } from "@/views/Administrator/Roles/config";

describe("role definition", () => {
  it("declares responsive role management through the shared list system", () => {
    expect(roleDefinition.endpoint).toBe("/roles");
    expect(roleDefinition.permission.view).toBe("roles.manage");
    expect(roleDefinition.columns.map((column) => column.key)).toEqual([
      "name",
      "roleKind",
      "permissionCount",
      "assignedUserCount",
      "updatedAt",
    ]);
    expect("responsive" in roleDefinition).toBe(false);
  });
});
