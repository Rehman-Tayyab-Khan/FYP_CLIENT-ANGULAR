import { Routes } from '@angular/router';
import { FDO_PERMISSIONS } from '../../core/constants/fdo-permissions';

export const appointmentCrudRoutes: Routes = [
  {
    path: '',
    data: {
      requiredAnyPermissions: [
        FDO_PERMISSIONS.VIEW_APPOINTMENTS,
        FDO_PERMISSIONS.UPDATE_APPOINTMENT,
      ],
    },
    loadComponent: () =>
      import('./appointment-list/appointment-list.component').then(
        (m) => m.AppointmentListComponent,
      ),
  },
  {
    path: 'new',
    data: {
      requiredPermission: FDO_PERMISSIONS.CREATE_APPOINTMENT,
    },
    loadComponent: () =>
      import('./appointment-create/appointment-create.component').then(
        (m) => m.AppointmentCreateComponent,
      ),
  },
  {
    path: 'form',
    redirectTo: 'new',
    pathMatch: 'full',
  },
  {
    path: ':id',
    data: {
      requiredAnyPermissions: [
        FDO_PERMISSIONS.VIEW_APPOINTMENTS,
        FDO_PERMISSIONS.UPDATE_APPOINTMENT,
      ],
    },
    loadComponent: () =>
      import('./appointment-detail/appointment-detail.component').then(
        (m) => m.AppointmentDetailComponent,
      ),
  },
];

export const appointmentListAndDetailRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./appointment-list/appointment-list.component').then(
        (m) => m.AppointmentListComponent,
      ),
  },
  {
    path: 'new',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'form',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./appointment-detail/appointment-detail.component').then(
        (m) => m.AppointmentDetailComponent,
      ),
  },
];
