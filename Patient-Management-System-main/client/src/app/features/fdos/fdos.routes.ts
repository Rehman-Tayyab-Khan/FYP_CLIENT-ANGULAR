import { Routes } from '@angular/router';

export const fdoManageRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./fdo-list/fdo-list.component').then((m) => m.FdoListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./fdo-create/fdo-create.component').then(
        (m) => m.FdoCreateComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./fdo-detail/fdo-detail.component').then(
        (m) => m.FdoDetailComponent,
      ),
  },
];
