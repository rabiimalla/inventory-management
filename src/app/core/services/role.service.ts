import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { delay, Observable, of, throwError } from 'rxjs';

import { UserParams } from '../interfaces/user.interface';
import { RoleParams } from '../interfaces/role.interface';
import { getFromStorage, randomId, saveToStorage } from './helper.service';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private rolesSignal = signal<RoleParams[]>(getFromStorage<RoleParams[]>('roles') || []);
  private usersSignal = signal<UserParams[]>(getFromStorage<UserParams[]>('users') || []);
  roles$ = toObservable(this.rolesSignal);

  createRole(roleData: Omit<RoleParams, 'id' | 'createdAt'>): Observable<RoleParams> {
    const duplicateError = this.checkDuplicateRole(roleData);

    if (duplicateError) {
      return duplicateError;
    }

    const newRole: RoleParams = {
      ...roleData,
      id: randomId(),
      createdAt: new Date(),
    };

    const updatedRoles = [...this.rolesSignal(), newRole];
    this.rolesSignal.set(updatedRoles);
    saveToStorage('roles', updatedRoles);

    return of(newRole).pipe(delay(300));
  }

  updateRole(id: string, updates: Partial<RoleParams>): Observable<RoleParams> {
    const roles = this.rolesSignal();
    const index = roles.findIndex((r) => r.id === id);

    if (index === -1) {
      return throwError(() => new Error(`Role ${id} not found`));
    }

    /* Check if the role with the given name already exists */
    if (updates.name) {
      const duplicateError = this.checkDuplicateRole(updates, index);

      if (duplicateError) {
        return duplicateError;
      }
    }

    const updatedRole = { ...roles[index], ...updates };
    const updatedRoles = [...roles];
    updatedRoles[index] = updatedRole;

    this.rolesSignal.set(updatedRoles);
    saveToStorage('roles', updatedRoles);

    return of(updatedRole).pipe(delay(300));
  }

  deleteRole(id: string): Observable<boolean> {
    const role = this.rolesSignal().find((role) => role.id === id);
    if (!role) {
      return throwError(() => new Error('Role not found'));
    }

    /* Lets assume there are some undeletable roles */
    if (['admin', 'supervisor', 'salesperson'].includes(role.name.toLocaleLowerCase())) {
      return throwError(() => new Error('Can not delete default roles.'));
    }

    /* Restrict deleting roles that are currently assigned to any user */
    const usersWithRole = this.usersSignal().filter((user) => user.roleId === id);
    if (usersWithRole.length > 0) {
      return throwError(
        () => new Error(`Can not delete role with ${usersWithRole.length} assigned user(s)`)
      );
    }

    const updatedRoles = this.rolesSignal().filter((role) => role.id !== id);
    this.rolesSignal.set(updatedRoles);
    saveToStorage('roles', updatedRoles);

    return of(true).pipe(delay(300));
  }

  private checkDuplicateRole(
    role: Partial<RoleParams>,
    roleIndex?: number
  ): Observable<never> | null {
    const roles = this.rolesSignal();
    const existingRole = roleIndex
      ? roles.find((r, i) => i !== roleIndex && r.name.toLowerCase() === role.name!.toLowerCase())
      : roles.find((r) => r.name.toLowerCase() === role.name!.toLowerCase());

    if (existingRole) {
      return throwError(() => new Error('Role with the given name already exists.'));
    }

    return null;
  }
}
