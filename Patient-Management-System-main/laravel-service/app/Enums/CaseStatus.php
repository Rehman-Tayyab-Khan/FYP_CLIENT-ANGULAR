<?php

namespace App\Enums;

enum CaseStatus: string
{
    case ACTIVE = 'Active';
    case ON_HOLD = 'On Hold';
    case CLOSED = 'Closed';
    case TRANSFERRED = 'Transferred';
    case CANCELLED = 'Cancelled';
}
