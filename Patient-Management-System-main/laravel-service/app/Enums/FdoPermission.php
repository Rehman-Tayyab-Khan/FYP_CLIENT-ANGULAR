<?php

namespace App\Enums;

enum FdoPermission: string
{
    case VIEW_PATIENTS = 'view_patients';
    case CREATE_PATIENT = 'create_patient';
    case UPDATE_PATIENT = 'update_patient';

    case VIEW_CASES = 'view_cases';
    case CREATE_CASE = 'create_case';
    case UPDATE_CASE = 'update_case';

    case VIEW_APPOINTMENTS = 'view_appointments';
    case CREATE_APPOINTMENT = 'create_appointment';
    case UPDATE_APPOINTMENT = 'update_appointment';

    case VIEW_DOCTORS = 'view_doctors';

    case EXPORT_PATIENTS = 'export_patients';
    case EXPORT_CASES = 'export_cases';
    case EXPORT_APPOINTMENTS = 'export_appointments';
    case EXPORT_VISITS = 'export_visits';
}
