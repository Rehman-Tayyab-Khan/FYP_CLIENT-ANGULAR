<?php

namespace App\Enums;

enum PatientStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case DECEASED = 'deceased';
    case TRANSFERRED = 'transferred';
}
