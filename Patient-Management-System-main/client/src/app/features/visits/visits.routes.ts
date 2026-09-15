import { Routes } from '@angular/router';

export const visitListAndDetailRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./visit-list/visit-list.component').then(
        (m) => m.VisitListComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./visit-detail/visit-detail.component').then(
        (m) => m.VisitDetailComponent,
      ),
  },
];
