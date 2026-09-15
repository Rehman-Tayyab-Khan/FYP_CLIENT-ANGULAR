<?php

namespace App\Models;

use App\Enums\CaseCategory;
use App\Enums\CasePriority;
use App\Enums\CaseStatus;
use App\Enums\CaseType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PatientCase extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = [
        'case_number',
        'patient_id',
        'practice_location_id',
        'category',
        'purpose_of_visit',
        'case_type',
        'priority',
        'case_status',
        'date_of_accident',
        'insurance_id',
        'firm_id',
        'referred_by',
        'referred_doctor_name',
        'opening_date',
        'closing_date',
        'clinical_notes',
    ];

    // automatically convert attributes to date data types
    protected $casts = [
        'category' => CaseCategory::class,
        'case_type' => CaseType::class,
        'priority' => CasePriority::class,
        'case_status' => CaseStatus::class,
        'date_of_accident' => 'date',
        'opening_date' => 'date',
        'closing_date' => 'date',
    ];

    // Auto-generate case_number before creating
    protected static function booted(): void
    {
        static::creating(function ($case) {
            $year = now()->format('Y');
            $sequence = str_pad(
                PatientCase::withTrashed()->whereYear('created_at', $year)->count() + 1,
                5,
                '0',
                STR_PAD_LEFT
            );
            $case->case_number = "CASE-{$year}-{$sequence}";
        });
    }

    // One case belongs to one patient
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    // One case belongs to one practice location
    public function practiceLocation()
    {
        return $this->belongsTo(PracticeLocation::class);
    }

    // One case optionally belongs to one insurance
    public function insurance()
    {
        return $this->belongsTo(Insurance::class);
    }

    // One case optionally belongs to one firm
    public function firm()
    {
        return $this->belongsTo(Firm::class);
    }

    // One case has many appointments
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'case_id');
    }

    // One case has many visits (denormalized)
    public function visits()
    {
        return $this->hasMany(Visit::class, 'case_id');
    }
}
