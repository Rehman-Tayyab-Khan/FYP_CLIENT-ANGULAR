<?php

namespace App\Enums;

enum CaseCategory: string
{
    case GENERAL_MEDICINE = 'General Medicine';
    case SURGERY = 'Surgery';
    case PEDIATRICS = 'Pediatrics';
    case CARDIOLOGY = 'Cardiology';
    case ORTHOPEDICS = 'Orthopedics';
    case NEUROLOGY = 'Neurology';
    case DERMATOLOGY = 'Dermatology';
    case GYNECOLOGY = 'Gynecology';
    case OPHTHALMOLOGY = 'Ophthalmology';
    case ENT = 'ENT';
    case DENTAL = 'Dental';
    case PSYCHIATRY = 'Psychiatry';
    case PHYSICAL_THERAPY = 'Physical Therapy';
    case EMERGENCY = 'Emergency';
    case OTHER = 'Other';
}
