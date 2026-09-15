<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PatientCase;
use App\Models\Patient;
use App\Models\PracticeLocation;
use App\Models\Insurance;
use App\Models\Firm;
use App\Enums\CaseCategory;
use App\Enums\CaseType;
use App\Enums\CasePriority;
use App\Enums\CaseStatus;
use Carbon\Carbon;

class PatientCaseSeeder extends Seeder
{
    public function run(): void
    {
        $insurances = Insurance::all();
        $firms = Firm::all();
        $locations = PracticeLocation::all();
        $categories = CaseCategory::cases();
        $types = CaseType::cases();
        $priorities = CasePriority::cases();
        $statuses = CaseStatus::cases();

        foreach (Patient::all() as $index => $patient) {
            $category = $categories[array_rand($categories)];
            $status = $statuses[array_rand($statuses)];
            
            // Randomly decide if it's an accident case (30% chance)
            $isAccident = rand(1, 10) <= 3;
            $openingDate = Carbon::now()->subDays(rand(10, 365));

            PatientCase::create([
                'patient_id'           => $patient->id,
                'case_number'          => 'CASE-' . $openingDate->year . '-' . str_pad($index + 1, 5, '0', STR_PAD_LEFT),
                'practice_location_id' => $locations->isNotEmpty() ? $locations->random()->id : 1,
                'category'             => $category->value,
                'purpose_of_visit'     => $this->getPurposeForCategory($category),
                'case_type'            => $types[array_rand($types)]->value,
                'priority'             => $priorities[array_rand($priorities)]->value,
                'case_status'          => $status->value,
                'date_of_accident'     => $isAccident ? $openingDate->copy()->subDays(rand(1, 14)) : null,
                'insurance_id'         => $insurances->isNotEmpty() ? $insurances->random()->id : null,
                'firm_id'              => $firms->isNotEmpty() ? $firms->random()->id : null,
                'referred_by'          => rand(0, 1) ? 'Self' : 'Doctor ' . fake()->lastName(),
                'referred_doctor_name' => rand(0, 1) ? null : fake()->name('male'),
                'opening_date'         => $openingDate->format('Y-m-d'),
                'closing_date'         => $status === CaseStatus::CLOSED ? $openingDate->copy()->addDays(rand(30, 90))->format('Y-m-d') : null,
                'clinical_notes'       => 'Patient presented with symptoms related to ' . strtolower($category->value) . '. Initial assessment conducted.',
            ]);
        }
    }

    private function getPurposeForCategory(CaseCategory $category): string
    {
        return match($category) {
            CaseCategory::GENERAL_MEDICINE => 'Annual physical examination and wellness check.',
            CaseCategory::CARDIOLOGY => 'Complaint of chest discomfort and shortness of breath.',
            CaseCategory::ORTHOPEDICS => 'Persistent joint pain in the knee area after minor fall.',
            CaseCategory::DERMATOLOGY => 'Evaluation of unusual skin rash on the upper arm.',
            CaseCategory::EMERGENCY => 'Acute abdominal pain and high fever.',
            default => 'Routine consultation for ongoing health management.',
        };
    }
}