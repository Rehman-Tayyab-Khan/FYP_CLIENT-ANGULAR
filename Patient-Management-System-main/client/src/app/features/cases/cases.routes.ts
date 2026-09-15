import { Routes } from '@angular/router';

export const caseManageRoutes: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./case-create/case-create.component').then(
        (m) => m.CaseCreateComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./case-list/case-list.component').then(
        (m) => m.CaseListComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./case-detail/case-detail.component').then(
        (m) => m.CaseDetailComponent,
      ),
  },
];

export const caseListAndDetailRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./case-list/case-list.component').then(
        (m) => m.CaseListComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./case-detail/case-detail.component').then(
        (m) => m.CaseDetailComponent,
      ),
  },
];

export const caseDetailRoutes: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./case-detail/case-detail.component').then(
        (m) => m.CaseDetailComponent,
      ),
  },
];
