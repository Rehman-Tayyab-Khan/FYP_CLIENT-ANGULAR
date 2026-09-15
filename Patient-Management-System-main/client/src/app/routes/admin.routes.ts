import { Routes } from '@angular/router';
import { appointmentCrudRoutes } from '../features/appointments/appointments.routes';
import { caseManageRoutes } from '../features/cases/cases.routes';
import { doctorManageRoutes } from '../features/doctors/doctors.routes';
import { fdoManageRoutes } from '../features/fdos/fdos.routes';
import { insuranceManageRoutes } from '../features/insurances/insurances.routes';
import { patientManageRoutes } from '../features/patients/patients.routes';
import { practiceLocationManageRoutes } from '../features/practice-locations/practice-locations.routes';
import { specialtyManageRoutes } from '../features/specialties/specialties.routes';
import { visitListAndDetailRoutes } from '../features/visits/visits.routes';

export const adminChildRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../features/dashbaord/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: 'create-user',
    loadComponent: () =>
      import('../features/admin/create-user/create-user.component').then(
        (m) => m.CreateUserComponent,
      ),
  },
  {
    path: 'fdo',
    children: fdoManageRoutes,
  },
  {
    path: 'doctors',
    children: doctorManageRoutes,
  },
  {
    path: 'specialties',
    children: specialtyManageRoutes,
  },
  {
    path: 'insurances',
    children: insuranceManageRoutes,
  },
  {
    path: 'practice-locations',
    children: practiceLocationManageRoutes,
  },
  {
    path: 'patients',
    children: patientManageRoutes,
  },
  {
    path: 'cases',
    children: caseManageRoutes,
  },
  {
    path: 'appointments',
    children: appointmentCrudRoutes,
  },
  {
    path: 'visits',
    children: visitListAndDetailRoutes,
  },
  {
    path: 'firms',
    loadChildren: () => import('../features/firms/firms.routes').then(m => m.FIRMS_ROUTES),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
