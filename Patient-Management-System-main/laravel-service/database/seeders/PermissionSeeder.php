<?php

namespace Database\Seeders;

use App\Enums\FdoPermission;
use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $legacyDoctorPermission = 'view_doctor_schedules';
        $doctorViewPermission = FdoPermission::VIEW_DOCTORS->value;

        // Preserve existing assignments by renaming the legacy permission in place when possible.
        if (!Permission::query()->where('permission_name', $doctorViewPermission)->exists()) {
            Permission::query()
                ->where('permission_name', $legacyDoctorPermission)
                ->update(['permission_name' => $doctorViewPermission]);
        }

        $permissionNames = array_map(
            static fn(FdoPermission $permission): string => $permission->value,
            FdoPermission::cases(),
        );

        foreach ($permissionNames as $permissionName) {
            Permission::query()->updateOrCreate([
                'permission_name' => $permissionName,
            ]);
        }

        // Keep the permissions table aligned with enum values only.
        Permission::query()
            ->whereNotIn('permission_name', $permissionNames)
            ->delete();
    }
}
