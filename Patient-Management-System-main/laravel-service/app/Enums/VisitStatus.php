<?php

namespace App\Enums;

enum VisitStatus: string
{
    case DRAFT = 'Draft';
    case COMPLETED = 'Completed';
    case CANCELLED = 'Cancelled';
    case BILLED = 'Billed';
}
