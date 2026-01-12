import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { delay, Observable, of, throwError } from 'rxjs';

import { UserParams } from '../interfaces/user.interface';
import { randomId } from './helper.service';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersSignal = signal<UserParams[]>(StorageService.getFromStorage<UserParams[]>('users') || []);
  users$ = toObservable(this.usersSignal);

  createUser(userData: Omit<UserParams, 'id' | 'createdAt' | 'updatedAt'>): Observable<UserParams> {
    const duplicateError = this.checkDuplicateUser(userData);

    if (duplicateError) {
      return duplicateError;
    }

    const newUser: UserParams = {
      ...userData,
      id: randomId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedUsers = [...this.usersSignal(), newUser];
    this.usersSignal.set(updatedUsers);
    StorageService.saveToStorage('users', updatedUsers);

    return of(newUser).pipe(delay(300));
  }

  updateUser(id: string, updates: Partial<UserParams>): Observable<UserParams> {
    const users = this.usersSignal();
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      return throwError(() => new Error(`User ${id} not found`));
    }

    /* Check if the user with the given username or email already exists */
    if (updates.username || updates.email) {
      const duplicateError = this.checkDuplicateUser(updates, index);

      if (duplicateError) {
        return duplicateError;
      }
    }

    updates.updatedAt = new Date();
    const updatedUser = { ...users[index], ...updates };
    const updatedUsers = [...users];
    updatedUsers[index] = updatedUser;

    this.usersSignal.set(updatedUsers);
    StorageService.saveToStorage('users', updatedUsers);

    return of(updatedUser).pipe(delay(300));
  }

  deleteUser(id: string): Observable<boolean> {
    const user = this.usersSignal().find((user) => user.id === id);
    if (!user) {
      return throwError(() => new Error('User not found'));
    }

    if(user.username === 'admin_user') {
      return throwError(() => new Error('Can not delete default admin user'));
    }

    const updatedUsers = this.usersSignal().filter((user) => user.id !== id);
    this.usersSignal.set(updatedUsers);
    StorageService.saveToStorage('users', updatedUsers);

    return of(true).pipe(delay(300));
  }

  private checkDuplicateUser(
    user: Partial<UserParams>,
    userIndex?: number
  ): Observable<never> | null {
    const users = this.usersSignal();

    const usernameTaken =
      userIndex !== undefined && userIndex > -1
        ? users.find(
            (u, i) => i !== userIndex && u.username.toLowerCase() === user.username?.toLowerCase()
          )
        : users.find((u) => u.username.toLowerCase() === user.username!.toLowerCase());

    if (usernameTaken) {
      return throwError(() => new Error('Username is already taken.'));
    }

    const emailExists =
      userIndex !== undefined && userIndex > -1
        ? users.find(
            (u, i) => i !== userIndex && u.email.toLowerCase() === user.email!.toLowerCase()
          )
        : users.find((u) => u.email.toLowerCase() === user.email!.toLowerCase());

    if (emailExists) {
      return throwError(() => new Error('Email is already used.'));
    }

    return null;
  }
}
