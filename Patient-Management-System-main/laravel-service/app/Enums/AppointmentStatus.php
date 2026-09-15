<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case SCHEDULED = 'Scheduled';
    case CONFIRMED = 'Confirmed';
    case CHECKED_IN = 'Checked In';
    case IN_PROGRESS = 'In Progress';
    case COMPLETED = 'Completed';
    case CANCELLED = 'Cancelled';
    case NO_SHOW = 'No Show';
    case RESCHEDULED = 'Rescheduled';
}
