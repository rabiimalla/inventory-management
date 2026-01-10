import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
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
