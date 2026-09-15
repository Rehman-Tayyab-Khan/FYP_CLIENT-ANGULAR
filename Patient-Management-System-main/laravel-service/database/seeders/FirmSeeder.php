<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Firm;
use App\Enums\FirmType;

class FirmSeeder extends Seeder
{
    public function run(): void
    {
        Firm::create([
            'firm_name' => 'ABC Law Firm',
            'firm_type' => FirmType::LEGAL->value,
            'address' => 'Lahore',
            'phone' => '3333333333',
            'contact_person' => 'Ali Khan',
        ]);

        Firm::create([
            'firm_name' => 'XYZ Corporation',
            'firm_type' => FirmType::CORPORATE->value,
            'address' => 'Karachi',
            'phone' => '4444444444',
            'contact_person' => 'Sara Ahmed',
        ]);
    }
}