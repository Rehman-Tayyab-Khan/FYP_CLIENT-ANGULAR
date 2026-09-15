<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InsuranceAddress extends Model
{
    use SoftDeletes, HasUuids;

    protected $fillable = [
        'insurance_id',
        'address',
        'phone',
        'is_primary'  // marks the main/default address for this insurance
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    // One insurance address belongs to one insurance company
    public function insurance()
    {
        return $this->belongsTo(Insurance::class);
    }
}
