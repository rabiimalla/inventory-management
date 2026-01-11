import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { UserParams } from '../interfaces/user.interface';
import { getFromStorage } from './helper.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersSignal = signal<UserParams[]>(getFromStorage<UserParams[]>('users') || []);
  users$ = toObservable(this.usersSignal);
}
