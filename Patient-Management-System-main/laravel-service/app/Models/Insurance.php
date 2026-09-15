<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Insurance extends Model
{
    use SoftDeletes, HasUuids;

    protected $table = 'insurances';

    protected $fillable = [
        'insurance_name',
        'insurance_code',
        'is_active',
    ];

    public function insuranceAddress()
    {
        return $this->hasMany(InsuranceAddress::class);
    }

    public function patientCases()
    {
        return $this->hasMany(PatientCase::class);
    }

    public function primaryAddress()
    {
        return $this->hasOne(InsuranceAddress::class)->where('is_primary', true);
    }
}
