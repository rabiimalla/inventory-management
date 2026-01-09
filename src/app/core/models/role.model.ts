import { randomId } from "../services/helper.service";

export enum Permission {
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_ITEMS = 'manage_items',
  MANAGE_SELLS = 'manage_sales',
  VIEW_DASHBOARD = 'view_dashboard'
}

export class RoleModel {
  id: string | undefined;
  name: string;
  createdAt: Date;
  permissions: Permission[];

  constructor(id: string | undefined, name: string, createdAt: Date, permissions: Permission[]) {
    this.id = id || randomId();
    this.name = name;
    this.createdAt = createdAt;
    this.permissions = permissions;
  }
}