<?php 

namespace App\Enums;

enum FirmType: string {
    case LEGAL = "legal";
    case CORPORATE = "corporate";
    case GOVERNMENT = "government";
    case OTHER = "other";
}