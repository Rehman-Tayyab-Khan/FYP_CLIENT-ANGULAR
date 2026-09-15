<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DoctorProfile;
use App\Models\User;
use App\Models\Specialty;
use App\Models\PracticeLocation;

class DoctorProfileSeeder extends Seeder
{
    public function run(): void
    {
        $doctors = User::where('role', 'doctor')->get();

        foreach ($doctors as $doctor) {
            DoctorProfile::create([
                'user_id' => $doctor->id,
                'specialty_id' => Specialty::inRandomOrder()->first()->id,
                'practice_location_id' => PracticeLocation::inRandomOrder()->first()->id,
                'license_number' => 'LIC-' . rand(10000, 99999),
                'availability_schedule' => json_encode([
                    'monday' => ['09:00-17:00'],
                    'tuesday' => ['09:00-17:00'],
                    'wednesday' => ['09:00-17:00'],
                    'thursday' => ['09:00-17:00'],
                    'friday' => ['09:00-17:00']
                ]),
            ]);
        }
    }
}