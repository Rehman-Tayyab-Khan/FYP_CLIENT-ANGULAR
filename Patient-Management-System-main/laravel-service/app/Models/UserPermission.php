<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserPermission extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'permission_id',
    ];

    // Belongs to the FDO user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Belongs to the permission type
    public function permission()
    {
        return $this->belongsTo(Permission::class);
    }
}
