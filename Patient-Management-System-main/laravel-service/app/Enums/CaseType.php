<?php

namespace App\Enums;

enum CaseType: string
{
    case INITIAL_CONSULTATION = 'Initial Consultation';
    case FOLLOW_UP = 'Follow-up';
    case EMERGENCY = 'Emergency';
    case CHRONIC_CARE = 'Chronic Care';
    case PREVENTIVE_CARE = 'Preventive Care';
    case PRE_SURGICAL = 'Pre-surgical';
    case POST_SURGICAL = 'Post-surgical';
}
