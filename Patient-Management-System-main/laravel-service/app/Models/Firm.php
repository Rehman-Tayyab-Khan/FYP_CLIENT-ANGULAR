<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Enums\FirmType;

class Firm extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = [
        'firm_name',
        'firm_type',
        'address',
        'phone',
        'contact_person',
        'is_active',
    ];

    protected $casts = [
        'firm_type' => FirmType::class,
    ];

    public function patientCases()
    {
        return $this->hasMany(PatientCase::class);
    }
}
