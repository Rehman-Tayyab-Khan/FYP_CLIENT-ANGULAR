import {
  FDO_PERMISSIONS,
  FdoPermission,
} from '../core/constants/fdo-permissions';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  requiredPermission?: FdoPermission;
  requiredAnyPermissions?: FdoPermission[];
}

export const NAV_ITEMS: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'grid_view' },
    { label: 'FDOs', route: '/admin/fdo', icon: 'person' },
    { label: 'Doctors', route: '/admin/doctors', icon: 'person' },
    {
      label: 'Specialties',
      route: '/admin/specialties',
      icon: 'medical_services',
    },
    {
      label: 'Insurances',
      route: '/admin/insurances',
      icon: 'shield',
    },
    {
      label: 'Practice Locations',
      route: '/admin/practice-locations',
      icon: 'location_on',
    },
    { label: 'Patients', route: '/admin/patients', icon: 'person' },
    { label: 'Cases', route: '/admin/cases', icon: 'folder' },
    {
      label: 'Appointments',
      route: '/admin/appointments',
      icon: 'calendar_month',
    },
    { label: 'Visits', route: '/admin/visits', icon: 'assignment' },
    { label: 'Firms', route: '/admin/firms', icon: 'business' },
  ],

  doctor: [
    { label: 'Dashboard', route: '/doctor/dashboard', icon: 'grid_view' },
    {
      label: 'My Appointments',
      route: '/doctor/appointments',
      icon: 'calendar_month',
    },
    { label: 'My Visits', route: '/doctor/visits', icon: 'assignment' },
    { label: 'Patients', route: '/doctor/patients', icon: 'person' },
  ],

  fdo: [
    { label: 'Dashboard', route: '/fdo/dashboard', icon: 'grid_view' },
    {
      label: 'Patients',
      route: '/fdo/patients',
      icon: 'person',
      requiredAnyPermissions: [
        FDO_PERMISSIONS.VIEW_PATIENTS,
        FDO_PERMISSIONS.CREATE_PATIENT,
      ],
    },
    {
      label: 'Cases',
      route: '/fdo/cases',
      icon: 'folder',
      requiredAnyPermissions: [
        FDO_PERMISSIONS.VIEW_CASES,
        FDO_PERMISSIONS.CREATE_CASE,
      ],
    },
    {
      label: 'Appointments',
      route: '/fdo/appointments',
      icon: 'calendar_month',
      requiredAnyPermissions: [
        FDO_PERMISSIONS.VIEW_APPOINTMENTS,
        FDO_PERMISSIONS.CREATE_APPOINTMENT,
        FDO_PERMISSIONS.UPDATE_APPOINTMENT,
      ],
    },
    {
      label: 'Doctors',
      route: '/fdo/doctors',
      icon: 'person',
      requiredPermission: FDO_PERMISSIONS.VIEW_DOCTORS,
    },
  ],
};
