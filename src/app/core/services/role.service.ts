import { Injectable, signal } from "@angular/core";
import { RoleParams } from "../interfaces/role.interface";
import { delay, Observable, of, throwError } from "rxjs";
import { getFromStorage, randomId, saveToStorage } from "./helper.service";

@Injectable({providedIn: 'root'})
export class RoleService {
  private rolesSignal = signal<RoleParams[]>(getFromStorage<RoleParams[]>('roles') || []);
  
  createRole(roleData: Omit<RoleParams, 'id' | 'createdAt'>): Observable<RoleParams> {
    const existingRole = this.rolesSignal()
      .find(r => r.name.toLowerCase() === roleData.name.toLowerCase());

    if(existingRole) {
      return throwError(() => new Error('Role with the given name already exists.'));
    }

    const newRole: RoleParams = {
      ...roleData,
      id: randomId(),
      createdAt: new Date()
    };

    const updatedRoles = [...this.rolesSignal(), newRole];
    this.rolesSignal.set(updatedRoles);
    saveToStorage('roles', updatedRoles);

    return of(newRole).pipe(delay(300));
  }

}
