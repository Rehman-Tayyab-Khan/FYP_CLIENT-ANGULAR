import { Routes } from '@angular/router';
import { appointmentListAndDetailRoutes } from '../features/appointments/appointments.routes';
import { caseDetailRoutes } from '../features/cases/cases.routes';
import { doctorListAndDetailRoutes } from '../features/doctors/doctors.routes';
import { patientListAndDetailRoutes } from '../features/patients/patients.routes';
import { visitListAndDetailRoutes } from '../features/visits/visits.routes';

export const doctorChildRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../features/dashbaord/doctor-dashboard/doctor-dashboard.component').then(
        (m) => m.DoctorDashboardComponent,
      ),
  },
  {
    path: 'appointments',
    children: appointmentListAndDetailRoutes,
  },
  {
    path: 'visits',
    children: visitListAndDetailRoutes,
  },
  {
    path: 'cases',
    children: caseDetailRoutes,
  },
  {
    path: 'patients',
    children: patientListAndDetailRoutes,
  },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
