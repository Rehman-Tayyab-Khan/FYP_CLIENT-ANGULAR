<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Specialty extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = [
        'specialty_name',
        'description',
        'is_active',
    ];


    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function doctorProfiles()
    {
        return $this->hasMany(DoctorProfile::class);
    }
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
