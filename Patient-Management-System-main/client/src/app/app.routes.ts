import { Routes } from '@angular/router';
import {
  adminGuard,
  adminChildGuard,
  doctorGuard,
  doctorChildGuard,
  fdoGuard,
  fdoChildGuard,
} from './core/guards/auth.guard';
import { authRoutes } from './features/auth/auth.routes';
import { homeRoutes } from './features/home/home.routes';
import { adminChildRoutes } from './routes/admin.routes';
import { doctorChildRoutes } from './routes/doctor.routes';
import { fdoChildRoutes } from './routes/fdo.routes';

export const routes: Routes = [
  ...homeRoutes,
  ...authRoutes,
  //INFO: Admin routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    canActivateChild: [adminChildGuard],
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: adminChildRoutes,
  },
  //INFO: Doctor routes
  {
    path: 'doctor',
    canActivate: [doctorGuard],
    canActivateChild: [doctorChildGuard],
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: doctorChildRoutes,
  },
  //INFO: FDO routes
  {
    path: 'fdo',
    canActivate: [fdoGuard],
    canActivateChild: [fdoChildGuard],
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: fdoChildRoutes,
  },
  { path: '**', redirectTo: '' },
];
