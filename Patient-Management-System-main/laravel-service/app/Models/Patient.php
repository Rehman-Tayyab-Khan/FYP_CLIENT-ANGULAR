<?php

namespace App\Models;

use App\Enums\Gender;
use App\Enums\PatientStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{

    use HasFactory, SoftDeletes, HasUuids;

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'date_of_birth',
        'gender',
        'email',
        'phone',
        'mobile',
        'address',
        'city',
        'state',
        'zip_code',
        'country',
        'emergency_contact_name',
        'emergency_contact_phone',
        'primary_physician',
        'insurance_provider',
        'insurance_policy_number',
        'preferred_language',
        'patient_status',
        'registration_date',
    ];


    protected $hidden = [
        'cnic', // never expose CNIC in API responses
    ];

    protected $casts = [
        'gender' => Gender::class,
        'patient_status' => PatientStatus::class,
        'date_of_birth' => 'date',
        'registration_date' => 'datetime',
    ];

    // Computed age from date_of_birth — never stored in DB
    public function getAgeAttribute(): int
    {
        // Convert date_of_birth into a Carbon date object
        $birthDate = \Carbon\Carbon::parse($this->date_of_birth);

        // Return the calculated age
        return $birthDate->age;
    }


    // One patient has many cases
    public function patientCases()
    {
        return $this->hasMany(PatientCase::class);
    }


    // One patient has many appointments (denormalized)
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }


    // One patient has many visits (denormalized)
    public function visits()
    {
        return $this->hasMany(Visit::class);
    }
}
