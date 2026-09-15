<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Enums\Role;
use App\Enums\FdoPermission;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids;
    use SoftDeletes;
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role',
        'first_name',
        'last_name',
        'email',
        'password',
        'phone',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password'
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            // 'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class
        ];
    }


    // One user (doctor) has one doctor profile
    public function doctorProfile()
    {
        return $this->hasOne(DoctorProfile::class);
    }

    // One FDO user has many permission rows
    public function userPermissions()
    {
        return $this->hasMany(UserPermission::class);
    }

    // Appointments created by this FDO
    public function createdAppointments()
    {
        return $this->hasMany(Appointment::class, 'created_by');
    }

    // Helper: check if user is admin
    public function isAdmin(): bool
    {
        return $this->role === Role::ADMIN;
    }

    // Helper: check if user is doctor
    public function isDoctor(): bool
    {
        return $this->role === Role::DOCTOR;
    }

    // Helper: check if user is FDO
    public function isFdo(): bool
    {
        return $this->role === Role::FDO;
    }
    public function hasFdoPermission(FdoPermission $permission): bool
    {
        if (!$this->isFdo()) {
            return false;
        }

        $permissionName = $permission->value;


        return $this->userPermissions()
            ->whereHas('permission', function ($query) use ($permissionName) {
                $query->where('permission_name', $permissionName);
            })
            ->exists();
    }
}
