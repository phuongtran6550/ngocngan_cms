import { createUserFormDefinition, userDefinition } from "@/views/Administrator/User/config";

describe("user definition", () => {
  it("declares responsive user management through the shared list system", () => {
    expect(userDefinition.endpoint).toBe("/users");
    expect(userDefinition.permission.view).toBe("users.manage");
    expect(userDefinition.columns.map((column) => column.key)).toEqual([
      "name",
      "username",
      "role",
      "assignedRoleName",
      "permissionCount",
      "updatedAt",
    ]);
    expect("responsive" in userDefinition).toBe(false);
  });

  it("keeps password optional when an administrator edits an existing user", () => {
    const definition = createUserFormDefinition({
      editing: true,
      roleOptions: [{ id: "role-1", name: "Bán hàng" }],
      loading: false,
    });
    const password = definition.fields.find((field) => field.key === "password");

    expect(password).toMatchObject({
      type: "password",
      required: false,
      placeholder: "Để trống nếu không đổi",
    });
  });
});
