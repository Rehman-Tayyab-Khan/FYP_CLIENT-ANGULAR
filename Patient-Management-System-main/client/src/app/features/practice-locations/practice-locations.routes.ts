import { Routes } from '@angular/router';

export const practiceLocationManageRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./practice-location-list/practice-location-list.component').then(
        (m) => m.PracticeLocationListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./practice-location-create/practice-location-create.component').then(
        (m) => m.PracticeLocationCreateComponent,
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
      import('./practice-location-detail/practice-location-detail.component').then(
        (m) => m.PracticeLocationDetailComponent,
      ),
  },
];

export const practiceLocationListAndDetailRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./practice-location-list/practice-location-list.component').then(
        (m) => m.PracticeLocationListComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./practice-location-detail/practice-location-detail.component').then(
        (m) => m.PracticeLocationDetailComponent,
      ),
  },
];
