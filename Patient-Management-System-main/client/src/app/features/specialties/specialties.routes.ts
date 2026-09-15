import { Routes } from '@angular/router';

export const specialtyManageRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./specialty-list/specialty-list.component').then(
        (m) => m.SpecialtyListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./specialty-create/specialty-create.component').then(
        (m) => m.SpecialtyCreateComponent,
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
      import('./specialty-detail/specialty-detail.component').then(
        (m) => m.SpecialtyDetailComponent,
      ),
  },
];
