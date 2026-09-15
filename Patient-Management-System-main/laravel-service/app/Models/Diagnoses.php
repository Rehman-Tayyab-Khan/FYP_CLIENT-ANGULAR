<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Diagnoses extends Model
{
    use HasUuids;

    protected $fillable = [
        'icd_code',
        'diagnoses_name',
        'description',
        'is_active',
    ];

    // One diagnoses is used in many visits
    public function visits()
    {
        return $this->hasMany(Visit::class);
    }
}
