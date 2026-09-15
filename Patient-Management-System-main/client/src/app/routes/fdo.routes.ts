import { Routes } from '@angular/router';
import { appointmentCrudRoutes } from '../features/appointments/appointments.routes';
import { FDO_PERMISSIONS } from '../core/constants/fdo-permissions';

export const fdoChildRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../features/dashbaord/fdo-dashboard/fdo-dashboard.component').then(
        (m) => m.FdoDashboardComponent,
      ),
  },
  {
    path: 'patients',
    data: {
      requiredAnyPermissions: [
        FDO_PERMISSIONS.VIEW_PATIENTS,
        FDO_PERMISSIONS.CREATE_PATIENT,
      ],
    },
    children: [
      {
        path: 'new',
        data: {
          requiredPermission: FDO_PERMISSIONS.CREATE_PATIENT,
        },
        loadComponent: () =>
          import('../features/patients/patient-create/patient-create.component').then(
            (m) => m.PatientCreateComponent,
          ),
      },
      {
        path: '',
        data: {
          requiredPermission: FDO_PERMISSIONS.VIEW_PATIENTS,
        },
        loadComponent: () =>
          import('../features/patients/patient-list/patient-list.component').then(
            (m) => m.PatientListComponent,
          ),
      },
      {
        path: ':id',
        data: {
          requiredPermission: FDO_PERMISSIONS.VIEW_PATIENTS,
        },
        loadComponent: () =>
          import('../features/patients/patient-detail/patient-detail.component').then(
            (m) => m.PatientDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'cases',
    data: {
      requiredAnyPermissions: [
        FDO_PERMISSIONS.VIEW_CASES,
        FDO_PERMISSIONS.CREATE_CASE,
      ],
    },
    children: [
      {
        path: 'new',
        data: {
          requiredPermission: FDO_PERMISSIONS.CREATE_CASE,
        },
        loadComponent: () =>
          import('../features/cases/case-create/case-create.component').then(
            (m) => m.CaseCreateComponent,
          ),
      },
      {
        path: '',
        data: {
          requiredPermission: FDO_PERMISSIONS.VIEW_CASES,
        },
        loadComponent: () =>
          import('../features/cases/case-list/case-list.component').then(
            (m) => m.CaseListComponent,
          ),
      },
      {
        path: ':id',
        data: {
          requiredPermission: FDO_PERMISSIONS.VIEW_CASES,
        },
        loadComponent: () =>
          import('../features/cases/case-detail/case-detail.component').then(
            (m) => m.CaseDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'appointments',
    data: {
      requiredAnyPermissions: [
        FDO_PERMISSIONS.VIEW_APPOINTMENTS,
        FDO_PERMISSIONS.CREATE_APPOINTMENT,
        FDO_PERMISSIONS.UPDATE_APPOINTMENT,
      ],
    },
    children: appointmentCrudRoutes,
  },
  {
    path: 'doctors',
    data: {
      requiredAnyPermissions: [FDO_PERMISSIONS.VIEW_DOCTORS],
    },
    children: [
      {
        path: 'new',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: '',
        loadComponent: () =>
          import('../features/doctors/doctor-list/doctor-list.component').then(
            (m) => m.DoctorListComponent,
          ),
        data: {
          requiredPermission: FDO_PERMISSIONS.VIEW_DOCTORS,
        },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('../features/doctors/doctor-detail/doctor-detail.component').then(
            (m) => m.DoctorDetailComponent,
          ),
        data: {
          requiredPermission: FDO_PERMISSIONS.VIEW_DOCTORS,
        },
      },
    ],
  },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
