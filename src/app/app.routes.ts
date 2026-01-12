import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { RoleGuard } from './core/guards/role.guard';
import { Permission } from './core/enums/permission.enum';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'roles',
    loadComponent: () => import('./features/roles/role-list/role-list')
      .then(m => m.RoleList),
    canActivate: [RoleGuard],
    data: { permissions: [Permission.MANAGE_ROLES]}
  },
  {
    path: 'items',
    loadComponent: () => import('./features/items/item-list/item-list')
      .then(m => m.ItemList),
    canActivate: [RoleGuard],
    data: { permissions: [Permission.MANAGE_ITEMS]}
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/user-list/user-list')
      .then(m => m.UserList),
    canActivate: [RoleGuard],
    data: { permissions: [Permission.MANAGE_USERS]}
  },
  {
    path: 'sales',
    loadComponent: () => import('./features/sales/sales')
      .then(m => m.Sales),
    canActivate: [RoleGuard],
    data: { permissions: [Permission.MANAGE_SELLS]}
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard')
      .then(m => m.Dashboard),
    canActivate: [RoleGuard],
    data: { permissions: [Permission.VIEW_DASHBOARD]}
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/unauthorized/unauthorized')
      .then(m => m.Unauthorized)
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
