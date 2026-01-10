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
