<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SpecialtySeeder::class,
            PracticeLocationSeeder::class,
            UserSeeder::class,
            InsuranceSeeder::class,
            FirmSeeder::class,
            PermissionSeeder::class,

            PatientSeeder::class,
            InsuranceAddressSeeder::class,
            UserPermissionSeeder::class,

            PatientCaseSeeder::class,
            DiagnosesSeeder::class,
            AppointmentSeeder::class,
            VisitSeeder::class,
        ]);
    }
}
