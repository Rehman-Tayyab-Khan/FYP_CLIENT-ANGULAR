<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Specialty;

class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'Cardiology',
            'Neurology',
            'Orthopedics',
            'Dermatology',
            'Pediatrics',
            'Gynecology',
        ];

        foreach ($data as $name) {
            Specialty::create([
                'specialty_name' => $name,
            ]);
        }
    }
}