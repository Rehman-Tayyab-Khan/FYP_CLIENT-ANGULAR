<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Appointment;
use App\Models\PatientCase;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\PracticeLocation;
use App\Models\User;
use App\Enums\AppointmentType;
use App\Enums\AppointmentStatus;

class AppointmentSeeder extends Seeder
{
    public function run(): void
    {
        $fdo = User::where('role', 'fdo')->first();
        $types = AppointmentType::cases();

        foreach (PatientCase::all() as $index => $case) {
            $doctor = DoctorProfile::inRandomOrder()->first();

            Appointment::create([
                'appointment_number'   => 'APT-' . now()->year . '-' . str_pad($index + 1, 6, '0', STR_PAD_LEFT),
                'case_id'              => $case->id,
                'patient_id'           => $case->patient_id,
                'doctor_id'            => $doctor->id,
                'appointment_date'     => now()->addDays($index)->format('Y-m-d'),
                'appointment_time'     => now()->format('H:i:s'),
                'appointment_type'     => $types[array_rand($types)],
                'specialty_id'         => Specialty::inRandomOrder()->first()->id,
                'practice_location_id' => PracticeLocation::inRandomOrder()->first()->id,
                'status'               => AppointmentStatus::SCHEDULED,
                'reason_for_visit'     => 'Routine checkup',
                'created_by'           => $fdo->id,
            ]);
        }
    }
}