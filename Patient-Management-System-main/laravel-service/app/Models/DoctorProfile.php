<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DoctorProfile extends Model
{
    use SoftDeletes, HasUuids, HasFactory;

    protected $fillable = [
        'user_id',
        'specialty_id',
        'practice_location_id',
        'license_number',
        'availability_schedule',
        'bio',
    ];

    // convert JSON-> PHP array
    protected $casts = [
        'availability_schedule' => 'array',
    ];

    // One doctor profile belongs to one user (one-to-one)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // One doctor profile belongs to one specialty
    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }

    // One doctor profile belongs to one practice location
    public function practiceLocation()
    {
        return $this->belongsTo(PracticeLocation::class);
    }

    // One doctor has many appointments
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    // One doctor has many visits
    public function visits()
    {
        return $this->hasMany(Visit::class, 'doctor_id');
    }
}
