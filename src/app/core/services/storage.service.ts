import { Injectable } from "@angular/core";

import { RoleParams } from "../interfaces/role.interface";
import { UserParams } from "../interfaces/user.interface";
import { randomId, STORAGE_PREFIX } from "./helper.service";
import { Permission } from "../enums/permission.enum";

@Injectable({providedIn: 'root'})
export class StorageService{
  static getFromStorage<T>(key: string): T | null {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : null;
  }

  static saveToStorage(key: string, data: any): void {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  }

  populateDefaultRolesAndUsers() {
    this.populateDefaultRoles();
    this.populateDefaultUsers();
  }

  private populateDefaultRoles() {
    const defaultRoles: RoleParams[] = [
      {
        id: randomId(),
        name: 'Admin',
        permissions: Object.values(Permission),
        createdAt: new Date()
      },
      {
        id: randomId(),
        name: 'Supervisor',
        permissions: [Permission.MANAGE_ITEMS, Permission.VIEW_DASHBOARD],
        createdAt: new Date()
      },
      {
        id: randomId(),
        name: 'Salesperson',
        permissions: [Permission.MANAGE_SELLS],
        createdAt: new Date()
      }
    ];
  
    StorageService.saveToStorage('roles', defaultRoles);
  }
  
  private populateDefaultUsers() {
    const defaultSavedRoles: RoleParams[] | null = StorageService.getFromStorage('roles');
    const adminRoleId = defaultSavedRoles!.find(role => role.name === 'Admin')?.id || '';
    const salesRoleId = defaultSavedRoles!.find(role => role.name === 'Salesperson')?.id || '';
    const supervisorRoleId = defaultSavedRoles!.find(role => role.name === 'Supervisor')?.id || '';
    
    const defaultUsers: UserParams[] = [
      {
        id: randomId(),
        fullname: 'Admin User',
        username: 'admin_user',
        email: 'admin.user@email.com',
        roleId: adminRoleId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomId(),
        fullname: 'Supervisor User',
        username: 'supervisor_user',
        email: 'supervisor.user@email.com',
        roleId: supervisorRoleId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: randomId(),
        fullname: 'Sales User',
        username: 'sales_user',
        email: 'sales.user@email.com',
        roleId: salesRoleId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    StorageService.saveToStorage('users', defaultUsers);
  }
}