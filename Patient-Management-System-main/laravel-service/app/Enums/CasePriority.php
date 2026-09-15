<?php

namespace App\Enums;

enum CasePriority: string
{
    case LOW = 'Low';
    case NORMAL = 'Normal';
    case HIGH = 'High';
    case URGENT = 'Urgent';
}
