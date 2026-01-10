import { Permission } from "../enums/permission.enum";

export interface RoleParams {
  id: string | undefined;
  name: string;
  createdAt: Date | undefined;
  permissions: Permission[];
}
