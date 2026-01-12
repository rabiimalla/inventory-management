import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from './core/services/auth.service';
import { Permission } from './core/enums/permission.enum';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLinkWithHref, AsyncPipe, TitleCasePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private destroyRef = inject(DestroyRef);
  protected readonly title = signal('inventory-management');
  canAccessRoles = signal(false);
  canAccessUsers = signal(false);
  canAccessItems = signal(false);
  canAccessSales = signal(false);
  canViewDashboard = signal(false);

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.manageAccess());
  }

  private manageAccess() {
    /* NOTE this role management logic should be moved to a custom directive. */
    this.canAccessRoles.set(this.auth.canAccess([Permission.MANAGE_ROLES]));
    this.canAccessUsers.set(this.auth.canAccess([Permission.MANAGE_USERS]));
    this.canAccessItems.set(this.auth.canAccess([Permission.MANAGE_ITEMS]));
    this.canAccessSales.set(this.auth.canAccess([Permission.MANAGE_SELLS]));
    this.canViewDashboard.set(this.auth.canAccess([Permission.VIEW_DASHBOARD]));
  }

  logout() {
    this.auth.logout();
  }
}
