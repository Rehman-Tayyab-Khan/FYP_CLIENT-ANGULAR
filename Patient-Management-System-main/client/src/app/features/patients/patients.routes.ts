import { Routes } from '@angular/router';

export const patientManageRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./patient-list/patient-list.component').then(
        (m) => m.PatientListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./patient-create/patient-create.component').then(
        (m) => m.PatientCreateComponent,
      ),
  },
  {
    path: 'form',
    redirectTo: 'new',
    pathMatch: 'full',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./patient-detail/patient-detail.component').then(
        (m) => m.PatientDetailComponent,
      ),
  },
];

export const patientListAndDetailRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./patient-list/patient-list.component').then(
        (m) => m.PatientListComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./patient-detail/patient-detail.component').then(
        (m) => m.PatientDetailComponent,
      ),
  },
];
