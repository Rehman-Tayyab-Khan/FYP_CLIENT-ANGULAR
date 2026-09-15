<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Insurance;

class InsuranceSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['insurance_name' => 'State Life', 'insurance_code' => 'SLI'],
            ['insurance_name' => 'Jubilee', 'insurance_code' => 'JUB'],
            ['insurance_name' => 'EFU', 'insurance_code' => 'EFU'],
        ];

        foreach ($data as $item) {
            Insurance::create($item);
        }
    }
}