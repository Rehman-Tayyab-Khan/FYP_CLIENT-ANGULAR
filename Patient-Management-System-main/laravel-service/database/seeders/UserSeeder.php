<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::factory()->create([
            'first_name' => 'System',
            'last_name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => '12345678',
            'is_active' => true,
            'role' => Role::ADMIN->value,
        ]);

        // Specific Doctor
        User::factory()
            ->has(\App\Models\DoctorProfile::factory(), 'doctorProfile')
            ->create([
                'first_name' => 'Main',
                'last_name' => 'Doctor',
                'email' => 'doctor@example.com',
                'password' => '12345678',
                'is_active' => true,
                'role' => Role::DOCTOR->value,
            ]);

        // Specific FDO
        User::factory()->create([
            'first_name' => 'Front',
            'last_name' => 'Desk',
            'email' => 'fdo@example.com',
            'password' => '12345678',
            'is_active' => true,
            'role' => Role::FDO->value,
        ]);

        // Random Doctors
        User::factory(4)
            ->has(\App\Models\DoctorProfile::factory(), 'doctorProfile')
            ->create([
                'role' => Role::DOCTOR->value,
            ]);

        // Random FDOs
        User::factory(4)->create([
            'role' => Role::FDO->value,
        ]);
    }
}