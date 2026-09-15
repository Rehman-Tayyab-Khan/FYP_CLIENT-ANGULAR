<?php
// app/Models/Visit.php

namespace App\Models;

use App\Enums\VisitStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Visit extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = [
        'visit_number',
        'appointment_id',
        'case_id',
        'patient_id',
        'doctor_id',
        'visit_date',
        'visit_time',
        'visit_duration_minutes',
        'diagnoses_id',
        'treatment',
        'treatment_plan',
        'prescription',
        'prescription_documents',
        'notes',
        'vital_signs',
        'symptoms',
        'follow_up_required',
        'follow_up_date',
        'referral_made',
        'referral_to',
        'visit_status',
        'completed_at',
    ];

    protected $casts = [
        'vital_signs' => 'array',
        'prescription_documents' => 'array',
        'follow_up_required' => 'boolean',
        'referral_made' => 'boolean',
        'visit_status' => VisitStatus::class,
    ];

    // Called automatically from Appointment::booted() on status → Completed
    public static function createFromAppointment(Appointment $appointment): self
    {
        $year = now()->format('Y');
        $sequence = str_pad(
            self::withTrashed()->whereYear('created_at', $year)->count() + 1,
            6,
            '0',
            STR_PAD_LEFT
        );

        return self::create([
            'visit_number' => "VST-{$year}-{$sequence}",
            'appointment_id' => $appointment->id,
            'case_id' => $appointment->case_id,
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $appointment->doctor_id,
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->toTimeString(),
            'visit_status' => 'Draft',
            // Doctor fills in diagnoses, treatment, vitals after this point
        ]);
    }

    // Belongs to one appointment (one-to-one)
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    // Belongs to a case (denormalized)
    public function case()
    {
        return $this->belongsTo(PatientCase::class, 'case_id');
    }

    // Belongs to a patient (denormalized)
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    // Belongs to a doctor profile
    public function doctor()
    {
        return $this->belongsTo(DoctorProfile::class, 'doctor_id');
    }

    // Belongs to a diagnoses from master list
    public function diagnoses()
    {
        return $this->belongsTo(Diagnoses::class);
    }
}
