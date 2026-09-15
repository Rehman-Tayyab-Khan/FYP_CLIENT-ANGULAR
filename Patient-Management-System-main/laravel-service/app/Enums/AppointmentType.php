<?php

namespace App\Enums;

enum AppointmentType: string
{
    case NEW_PATIENT = 'New Patient';
    case FOLLOW_UP = 'Follow-up';
    case CONSULTATION = 'Consultation';
    case PROCEDURE = 'Procedure';
    case TELEHEALTH = 'Telehealth';
    case EMERGENCY = 'Emergency';
    case ROUTINE_CHECKUP = 'Routine Checkup';
    case POST_OP_FOLLOW_UP = 'Post-op Follow-up';
}
