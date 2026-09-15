<?php

namespace App\Enums;

enum ReminderMethod: string
{
    case SMS = 'SMS';
    case EMAIL = 'Email';
    case PHONE = 'Phone';
    case NONE = 'None';
}
