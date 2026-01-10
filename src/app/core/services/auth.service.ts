import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { map, Observable } from 'rxjs';

import { StorageService } from './storage.service';
import { AuthLogin } from '../interfaces/auth-login.interface';

import { RoleParams } from '../interfaces/role.interface';
import { UserParams } from '../interfaces/user.interface';
import { Permission } from '../enums/permission.enum';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSignal = signal<UserParams | null>(null);
  private currentRoleSignal = signal<RoleParams | null>(null);
  userPermissions = computed(() => this.currentRoleSignal()?.permissions || []);
  
  private destroyRef = inject(DestroyRef);
  
  constructor(private storage: StorageService) {
    /* Restore the session from localStorage */
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.setCurrentUser(JSON.parse(savedUser));
    }
  }

  /* Handle login. In real world we would call backend API, here we are just simulating */
  login(loginCreds: AuthLogin): Observable<boolean> {
    return this.storage.getUsers().pipe(
      map((users) => {
        // For Demo only, we accept 'password' to be a valid password for any user as it is done in the backend in real world scenario
        const user = users.find(
          (user) => user.username === loginCreds.username && loginCreds.password === 'password'
        );

        if (user) {
          this.setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          return true;
        }

        throw new Error('Something is wrong with the provided data');
        
      })
    );
  }

  hasPermission(permission: Permission): boolean {
    return this.userPermissions().includes(permission);
  }

  canAccess(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  private setCurrentUser(user: UserParams) {
    this.currentUserSignal.set(user);

    this.storage
      .getRoles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((roles) => {
        const role = roles.find((r) => r.id === user.roleId) || null;
        this.currentRoleSignal.set(role);
      });
  }
}
