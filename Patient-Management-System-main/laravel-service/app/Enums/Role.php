<?php

namespace App\Enums;

enum Role: string
{
    case ADMIN = "admin";
    case DOCTOR = "doctor";
    case FDO = "fdo";
}
