<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PracticeLocation;

class PracticeLocationSeeder extends Seeder
{
    public function run(): void
    {
        PracticeLocation::create([
            'location_name' => 'Main Clinic',
            'address' => '123 Street',
            'city' => 'Lahore',
            'state' => 'Punjab',
            'zip' => '54000',
            'phone' => '1111111111',
            'email' => 'main@test.com',
        ]);

        PracticeLocation::create([
            'location_name' => 'Branch Clinic',
            'address' => '456 Street',
            'city' => 'Karachi',
            'state' => 'Sindh',
            'zip' => '74000',
            'phone' => '2222222222',
            'email' => 'branch@test.com',
        ]);
    }
}