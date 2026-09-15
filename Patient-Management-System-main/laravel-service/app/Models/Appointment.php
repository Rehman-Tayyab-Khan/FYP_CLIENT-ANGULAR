<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use App\Enums\AppointmentType;
use App\Enums\ReminderMethod;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;
use App\Models\Visit;

class Appointment extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = [
        'appointment_number',
        'case_id',
        'patient_id',
        'doctor_id',
        'appointment_date',
        'appointment_time',
        'appointment_type',
        'specialty_id',
        'practice_location_id',
        'duration_minutes',
        'status',
        'reminder_sent',
        'reminder_method',
        'notes',
        'reason_for_visit',
        'created_by',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'appointment_time' => 'string',
        'reminder_sent' => 'boolean',
        'appointment_type' => AppointmentType::class,
        'status' => AppointmentStatus::class,
        'reminder_method' => ReminderMethod::class,
    ];

    // Auto-generate appointment_number before creating
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($appointment) {
            if (!$appointment->appointment_number) {
                $year = now()->format('Y');
                $count = \Illuminate\Support\Facades\DB::table('appointments')
                    ->whereYear('created_at', $year)
                    ->count();

                $appointment->appointment_number = "APT-{$year}-" . str_pad($count + 1, 6, '0', STR_PAD_LEFT);
            }
        });

        // Auto-create visit when status changes to Completed
        static::updated(function ($appointment) {
            if (
                $appointment->isDirty('status') &&
                $appointment->status === AppointmentStatus::COMPLETED &&
                !$appointment->visit
            ) {
                Visit::createFromAppointment($appointment);
            }
        });
    }

    // Computed end_time — never stored in DB
    public function getEndTimeAttribute(): string
    {
        return Carbon::parse($this->appointment_time)
            ->addMinutes($this->duration_minutes)
            ->format('H:i:s');
    }

    // Belongs to a case
    public function patientCase()
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

    // Belongs to a specialty
    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }

    // Belongs to a practice location
    public function practiceLocation()
    {
        return $this->belongsTo(PracticeLocation::class);
    }

    // Created by an FDO user
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // One appointment has one visit (after completion)
    public function visit()
    {
        return $this->hasOne(Visit::class);
    }
}
