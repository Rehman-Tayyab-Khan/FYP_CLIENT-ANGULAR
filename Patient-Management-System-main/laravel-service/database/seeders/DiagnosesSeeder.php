<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Diagnoses;

class DiagnosesSeeder extends Seeder
{
    public function run(): void
    {

        $diagnoses = [
            ['icd_code' => 'I10',  'diagnoses_name' => 'Hypertension',          'description' => 'High blood pressure'],
            ['icd_code' => 'E11',  'diagnoses_name' => 'Type 2 Diabetes',        'description' => 'Chronic metabolic condition'],
            ['icd_code' => 'J45',  'diagnoses_name' => 'Asthma',                 'description' => 'Chronic respiratory condition'],
            ['icd_code' => 'M54',  'diagnoses_name' => 'Back Pain',              'description' => 'Lower back pain'],
            ['icd_code' => 'J00',  'diagnoses_name' => 'Common Cold',            'description' => 'Upper respiratory infection'],
            ['icd_code' => 'K21',  'diagnoses_name' => 'Acid Reflux (GERD)',     'description' => 'Gastroesophageal reflux disease'],
        ];

        foreach ($diagnoses as $item) {
            Diagnoses::create($item);
        }
    }
}