import { Routes } from '@angular/router';

export const doctorManageRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./doctor-list/doctor-list.component').then(
        (m) => m.DoctorListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./doctor-create/doctor-create.component').then(
        (m) => m.DoctorCreateComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./doctor-detail/doctor-detail.component').then(
        (m) => m.DoctorDetailComponent,
      ),
  },
];

export const doctorListAndDetailRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./doctor-list/doctor-list.component').then(
        (m) => m.DoctorListComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./doctor-detail/doctor-detail.component').then(
        (m) => m.DoctorDetailComponent,
      ),
  },
];
