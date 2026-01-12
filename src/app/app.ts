import { Component, OnInit, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { Permission } from './core/enums/permission.enum';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLinkWithHref, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('inventory-management');
  canAccessRoles = signal(false);
  canAccessUsers = signal(false);
  canAccessItems = signal(false);

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.canAccessRoles.set(this.auth.canAccess([Permission.MANAGE_ROLES]));
    this.canAccessUsers.set(this.auth.canAccess([Permission.MANAGE_USERS]));
    this.canAccessItems.set(this.auth.canAccess([Permission.MANAGE_ITEMS]));
  }

  logout() {
    this.auth.logout();
  }
}
