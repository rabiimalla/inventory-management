import { Injectable, signal } from "@angular/core";
import { delay, map, Observable, of } from "rxjs";

import { RoleParams } from "../interfaces/role.interface";
import { UserParams } from "../interfaces/user.interface";
import { randomId } from "./helper.service";
import { Permission } from "../enums/permission.enum";
import { toObservable } from "@angular/core/rxjs-interop";

@Injectable({providedIn: 'root'})
export class StorageService{
  private readonly PREFIX = 'inventory_system_';
  private usersSignal = signal<UserParams[]>(this.getFromStorage<UserParams[]>('users') || []);
  private rolesSignal = signal<RoleParams[]>(this.getFromStorage<RoleParams[]>('roles') || []);

  users$ = toObservable(this.usersSignal);

  getUsers(): Observable<UserParams[]> {
    return of(this.usersSignal()).pipe(
      delay(300),
      map(user => user)
    );
  }

  getRoles(): Observable<RoleParams[]> {
    return of(this.rolesSignal());
  }

  getFromStorage<T>(key: string): T | null {
    const data = localStorage.getItem(this.PREFIX + key);
    return data ? JSON.parse(data) : null;
  }

  saveToStorage(key: string, data: any): void {
    localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
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

    this.rolesSignal.set([...this.rolesSignal(), ...defaultRoles])
    this.saveToStorage('roles', defaultRoles);
  }
  
  private populateDefaultUsers() {
    const defaultSavedRoles: RoleParams[] | null = this.getFromStorage('roles');
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
        updatedAt: new Date()
      }
    ];

    this.usersSignal.set([...this.usersSignal(), ...defaultUsers]);
    this.saveToStorage('users', defaultUsers);
  }
}