import { Routes } from '@angular/router';

export const insuranceManageRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./insurance-list/insurance-list.component').then(
        (m) => m.InsuranceListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./insurance-create/insurance-create.component').then(
        (m) => m.InsuranceCreateComponent,
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
      import('./insurance-detail/insurance-detail.component').then(
        (m) => m.InsuranceDetailComponent,
      ),
  },
];
